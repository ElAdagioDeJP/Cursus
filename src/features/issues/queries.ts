/**
 * queries.ts — SOLO SQL + tipos. Sin imports de next/* (contrato §3).
 * Toda query filtra por workspaceId (aislamiento de tenant, security-review).
 */
import type { Sql, TransactionSql } from "postgres";
import { first, getSql, one } from "@/db/client";
import type {
  CommentRow,
  HistoryRow,
  IssueListRow,
  LabelRow,
} from "@/db/types";
import { formatIdentifier, isUuid, parseIdentifier } from "./lib/identifier";
import { keyBetween } from "./lib/ordering";
import type {
  AddCommentInput,
  AssignIssueInput,
  CreateIssueInput,
  CreateLabelInput,
  ListIssuesFilters,
  MoveIssueInput,
  SetPriorityInput,
  UpdateIssueInput,
  WorkflowStatus,
} from "./schema";

export interface QueryContext {
  /** null en llamadas MCP (actor de sistema; columnas de auditoría lo permiten). */
  userId: string | null;
  workspaceId: string;
}

type Db = Sql | TransactionSql;

const LIST_COLUMNS = `i.*, t.key as team_key, t.key || '-' || i.number as identifier,
  u.name as assignee_name, p.key as project_key,
  coalesce((select array_agg(l.name order by l.name) from issue_labels il
    join labels l on l.id = il.label_id where il.issue_id = i.id), '{}') as label_names`;

function decodeCursor(cursor: string): { sortKey: string; id: string } {
  const [sortKey, id] = Buffer.from(cursor, "base64url")
    .toString("utf8")
    .split("|");
  if (!sortKey || !id) throw new Error("Cursor inválido.");
  return { sortKey, id };
}

function encodeCursor(sortKey: string, id: string): string {
  return Buffer.from(`${sortKey}|${id}`).toString("base64url");
}

export async function listIssues(
  ctx: QueryContext,
  teamId: string,
  filters: ListIssuesFilters,
): Promise<{ issues: IssueListRow[]; nextCursor: string | null }> {
  const sql = getSql();
  const limit = filters.limit ?? 25;
  const conds = [
    sql`i.team_id = ${teamId}`,
    sql`t.workspace_id = ${ctx.workspaceId}`,
  ];
  if (filters.status?.length)
    conds.push(sql`i.status = ANY(${filters.status as string[]})`);
  if (filters.assigneeId === "none") conds.push(sql`i.assignee_id is null`);
  else if (filters.assigneeId)
    conds.push(sql`i.assignee_id = ${filters.assigneeId}`);
  if (filters.projectId) conds.push(sql`i.project_id = ${filters.projectId}`);
  if (filters.q)
    conds.push(
      sql`i.search_vector @@ plainto_tsquery('spanish', ${filters.q})`,
    );
  if (filters.cursor) {
    const c = decodeCursor(filters.cursor);
    conds.push(sql`(i.sort_key, i.id) > (${c.sortKey}, ${c.id})`);
  }
  const where = conds.reduce((a, c) => sql`${a} and ${c}`);
  const rows = await sql`select ${sql.unsafe(LIST_COLUMNS)}
    from issues i
    join teams t on t.id = i.team_id
    left join users u on u.id = i.assignee_id
    left join projects p on p.id = i.project_id
    where ${where}
    order by i.sort_key, i.id limit ${limit + 1}`;
  const hasMore = rows.length > limit;
  const page = (hasMore
    ? rows.slice(0, limit)
    : rows) as unknown as IssueListRow[];
  const last = first([...page].reverse());
  return {
    issues: page,
    nextCursor: hasMore && last ? encodeCursor(last.sort_key, last.id) : null,
  };
}

async function findIssueRow(db: Db, ctx: QueryContext, idOrIdentifier: string) {
  if (isUuid(idOrIdentifier)) {
    const rows = await db`select i.*, t.key as team_key from issues i
      join teams t on t.id = i.team_id
      where i.id = ${idOrIdentifier} and t.workspace_id = ${ctx.workspaceId}`;
    return first(rows);
  }
  const { teamKey, number } = parseIdentifier(idOrIdentifier);
  const rows = await db`select i.*, t.key as team_key from issues i
    join teams t on t.id = i.team_id
    where t.key = ${teamKey} and i.number = ${number} and t.workspace_id = ${ctx.workspaceId}`;
  return first(rows);
}

export async function getIssue(ctx: QueryContext, idOrIdentifier: string) {
  const sql = getSql();
  const row = await findIssueRow(sql, ctx, idOrIdentifier);
  if (!row) return null;
  const r = row as Record<string, unknown>;
  const issueId = String(r.id);
  const labels = (await sql`select l.* from issue_labels il
    join labels l on l.id = il.label_id where il.issue_id = ${issueId}`) as unknown as LabelRow[];
  const comments = (await sql`select c.*, u.name as author_name from comments c
    left join users u on u.id = c.author_id
    where c.issue_id = ${issueId} order by c.created_at`) as unknown as CommentRow[];
  const history = (await sql`select * from issue_history
    where issue_id = ${issueId} order by created_at desc limit 50`) as unknown as HistoryRow[];
  return {
    ...(r as object),
    identifier: formatIdentifier(String(r.team_key), r.number as number),
    labels,
    comments,
    history,
  };
}

export async function createIssue(ctx: QueryContext, input: CreateIssueInput) {
  const sql = getSql();
  return sql.begin(async (tx) => {
    const team = one(
      (await tx`select id, key, next_issue_number from teams
        where id = ${input.teamId} and workspace_id = ${ctx.workspaceId} for update`) as Array<{
        id: string;
        key: string;
        next_issue_number: number;
      }>,
      "Equipo",
    );
    const number = team.next_issue_number;
    const lastRows = (await tx`select sort_key from issues
      where team_id = ${team.id} and status = 'backlog' order by sort_key desc limit 1`) as Array<{
      sort_key: string;
    }>;
    const last = first(lastRows);
    const sortKey = keyBetween(last ? String(last.sort_key) : null, null);
    const issue = one(
      (await tx`insert into issues
        (team_id, project_id, parent_id, title, description, priority, estimate_points, assignee_id, due_date, number, sort_key, created_by)
        values (${team.id}, ${input.projectId ?? null}, ${input.parentId ?? null}, ${input.title},
          ${input.description}, ${input.priority}, ${input.estimatePoints ?? null},
          ${input.assigneeId ?? null}, ${input.dueDate ?? null}, ${number}, ${sortKey}, ${ctx.userId})
        returning *`) as Array<{ id: string }>,
      "Issue",
    );
    if (input.projectId) {
      const owned = await tx`select id from projects
        where id = ${input.projectId} and workspace_id = ${ctx.workspaceId}`;
      if (owned.length === 0)
        throw new Error("Proyecto no encontrado en este workspace.");
    }
    for (const labelId of input.labelIds) {
      await tx`insert into issue_labels (issue_id, label_id)
        select ${issue.id}, ${labelId} from labels where id = ${labelId} and workspace_id = ${ctx.workspaceId}
        on conflict do nothing`;
    }
    await tx`insert into issue_history (issue_id, actor_id, field, new_value)
      values (${issue.id}, ${ctx.userId}, 'created', ${formatIdentifier(team.key, number)})`;
    await tx`update teams set next_issue_number = ${number + 1} where id = ${team.id}`;
    return {
      id: issue.id,
      identifier: formatIdentifier(team.key, number),
      teamId: team.id,
    };
  });
}

export async function moveIssue(ctx: QueryContext, input: MoveIssueInput) {
  const sql = getSql();
  return sql.begin(async (tx) => {
    const row = await findIssueRow(tx, ctx, input.id);
    if (!row) throw new Error("Issue no encontrado en este workspace.");
    const r = row as {
      id: string;
      status: WorkflowStatus;
      team_id: string;
      team_key: string;
      number: number;
    };
    await tx`update issues set status = ${input.toStatus}, sort_key = ${input.toSortKey} where id = ${r.id}`;
    if (r.status !== input.toStatus) {
      await tx`insert into issue_history (issue_id, actor_id, field, old_value, new_value)
        values (${r.id}, ${ctx.userId}, 'status', ${r.status}, ${input.toStatus})`;
    }
    return {
      id: r.id,
      identifier: formatIdentifier(r.team_key, r.number),
      teamId: r.team_id,
      oldStatus: r.status,
      newStatus: input.toStatus as WorkflowStatus,
    };
  });
}

type UpdatableField =
  | "title"
  | "description"
  | "priority"
  | "estimate_points"
  | "due_date"
  | "project_id";

export async function updateIssue(ctx: QueryContext, input: UpdateIssueInput) {
  const sql = getSql();
  return sql.begin(async (tx) => {
    const row = await findIssueRow(tx, ctx, input.id);
    if (!row) throw new Error("Issue no encontrado en este workspace.");
    const r = row as Record<string, string | number | null>;
    const changes: Array<{
      field: UpdatableField;
      oldV: string;
      newV: string;
    }> = [];
    const track = (field: UpdatableField, oldV: unknown, newV: unknown) => {
      if (newV !== undefined && String(newV) !== String(oldV ?? "")) {
        changes.push({
          field,
          oldV: String(oldV ?? ""),
          newV: String(newV ?? ""),
        });
      }
    };
    track("title", r.title, input.title);
    track("description", r.description, input.description);
    track("priority", r.priority, input.priority);
    track(
      "estimate_points",
      r.estimate_points,
      input.estimatePoints ?? undefined,
    );
    track("due_date", r.due_date, input.dueDate ?? undefined);
    track("project_id", r.project_id, input.projectId);
    const updatedFields: string[] = [];
    const setters: Record<UpdatableField, (v: string) => Promise<unknown>> = {
      title: (v) =>
        tx`update issues set title = ${v} where id = ${String(r.id)}`,
      description: (v) =>
        tx`update issues set description = ${v} where id = ${String(r.id)}`,
      priority: (v) =>
        tx`update issues set priority = ${Number(v)} where id = ${String(r.id)}`,
      estimate_points: (v) =>
        tx`update issues set estimate_points = ${v === "" ? null : Number(v)} where id = ${String(r.id)}`,
      due_date: (v) =>
        tx`update issues set due_date = ${v === "" ? null : v} where id = ${String(r.id)}`,
      project_id: (v) =>
        tx`update issues set project_id = ${v === "" ? null : v} where id = ${String(r.id)}`,
    };
    for (const c of changes) {
      await setters[c.field](c.newV);
      await tx`insert into issue_history (issue_id, actor_id, field, old_value, new_value)
        values (${String(r.id)}, ${ctx.userId}, ${c.field}, ${c.oldV}, ${c.newV})`;
      updatedFields.push(c.field);
    }
    return { id: String(r.id), updatedFields };
  });
}

export async function assignIssue(ctx: QueryContext, input: AssignIssueInput) {
  const sql = getSql();
  return sql.begin(async (tx) => {
    const row = await findIssueRow(tx, ctx, input.id);
    if (!row) throw new Error("Issue no encontrado en este workspace.");
    const r = row as {
      id: string;
      assignee_id: string | null;
      team_id: string;
    };
    if (input.assigneeId) {
      const member = await tx`select 1 from memberships
        where user_id = ${input.assigneeId} and workspace_id = ${ctx.workspaceId}`;
      if (member.length === 0)
        throw new Error("Solo miembros del workspace pueden ser asignados.");
    }
    await tx`update issues set assignee_id = ${input.assigneeId} where id = ${r.id}`;
    await tx`insert into issue_history (issue_id, actor_id, field, old_value, new_value)
      values (${r.id}, ${ctx.userId}, 'assignee', ${r.assignee_id ?? ""}, ${input.assigneeId ?? ""})`;
    return { id: r.id, teamId: r.team_id };
  });
}

export async function setPriority(ctx: QueryContext, input: SetPriorityInput) {
  const sql = getSql();
  return sql.begin(async (tx) => {
    const row = await findIssueRow(tx, ctx, input.id);
    if (!row) throw new Error("Issue no encontrado en este workspace.");
    const r = row as { id: string; priority: number; team_id: string };
    await tx`update issues set priority = ${input.priority} where id = ${r.id}`;
    await tx`insert into issue_history (issue_id, actor_id, field, old_value, new_value)
      values (${r.id}, ${ctx.userId}, 'priority', ${String(r.priority)}, ${String(input.priority)})`;
    return { id: r.id, teamId: r.team_id };
  });
}

export async function deleteIssue(ctx: QueryContext, id: string) {
  const sql = getSql();
  const row = await findIssueRow(sql, ctx, id);
  if (!row) throw new Error("Issue no encontrado en este workspace.");
  const r = row as {
    id: string;
    team_id: string;
    team_key: string;
    number: number;
  };
  // Borrado suave: pasa a canceled y conserva historial (auditoría).
  await sql`update issues set status = 'canceled' where id = ${r.id}`;
  await sql`insert into issue_history (issue_id, actor_id, field, old_value, new_value)
    values (${r.id}, ${ctx.userId}, 'deleted', 'active', 'canceled')`;
  return {
    id: r.id,
    identifier: formatIdentifier(r.team_key, r.number),
    teamId: r.team_id,
  };
}

export async function addComment(ctx: QueryContext, input: AddCommentInput) {
  const sql = getSql();
  const row = await findIssueRow(sql, ctx, input.issueId);
  if (!row) throw new Error("Issue no encontrado en este workspace.");
  const r = row as { id: string; team_id: string };
  const comment = one(
    (await sql`insert into comments (issue_id, author_id, body)
      values (${r.id}, ${ctx.userId}, ${input.body}) returning *`) as unknown as CommentRow[],
    "Comentario",
  );
  return { comment, teamId: r.team_id };
}

export async function listComments(ctx: QueryContext, issueId: string) {
  const sql = getSql();
  const row = await findIssueRow(sql, ctx, issueId);
  if (!row) throw new Error("Issue no encontrado en este workspace.");
  const r = row as { id: string };
  const rows = await sql`select c.*, u.name as author_name from comments c
    left join users u on u.id = c.author_id
    where c.issue_id = ${r.id} order by c.created_at`;
  return rows as unknown as CommentRow[];
}

export async function createLabel(ctx: QueryContext, input: CreateLabelInput) {
  const sql = getSql();
  const label = one(
    (await sql`insert into labels (workspace_id, name, color)
      values (${ctx.workspaceId}, ${input.name}, ${input.color})
      on conflict (workspace_id, name) do update set color = excluded.color returning *`) as unknown as LabelRow[],
    "Etiqueta",
  );
  return label;
}

export async function listLabels(ctx: QueryContext) {
  const sql = getSql();
  const rows =
    await sql`select * from labels where workspace_id = ${ctx.workspaceId} order by name`;
  return rows as unknown as LabelRow[];
}

export async function searchIssues(
  ctx: QueryContext,
  query: string,
  limit = 25,
) {
  const sql = getSql();
  const rows = await sql`select ${sql.unsafe(LIST_COLUMNS)}
    from issues i
    join teams t on t.id = i.team_id
    left join users u on u.id = i.assignee_id
    left join projects p on p.id = i.project_id
    where t.workspace_id = ${ctx.workspaceId}
      and i.search_vector @@ plainto_tsquery('spanish', ${query})
    order by ts_rank(i.search_vector, plainto_tsquery('spanish', ${query})) desc
    limit ${Math.min(limit, 25)}`;
  return rows as unknown as IssueListRow[];
}
