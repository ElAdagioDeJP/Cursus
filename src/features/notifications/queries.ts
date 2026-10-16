/**
 * notifications.ts — SOLO SQL + tipos. Sin imports de next/* (contrato §3).
 * Queries de ámbito workspace (Inbox / Reviews / My issues / Pulse).
 * No existe columna de reviewer: Reviews usa assignee como proxy sobre
 * la cola de `review` del workspace.
 */
import { first, getSql } from "@/db/client";
import type { IssueListRow } from "@/db/types";
import type { QueryContext } from "@/features/issues/queries";

const LIST_COLUMNS = `i.*, t.key as team_key, t.key || '-' || i.number as identifier,
  u.name as assignee_name, p.key as project_key,
  coalesce((select array_agg(l.name order by l.name) from issue_labels il
    join labels l on l.id = il.label_id where il.issue_id = i.id), '{}') as label_names`;

/** Inbox: asignados a mí, activos (sin done/canceled), por updated_at desc. */
export async function listInboxIssues(
  ctx: QueryContext,
  userId: string,
  limit = 50,
): Promise<IssueListRow[]> {
  const sql = getSql();
  const rows = await sql`select ${sql.unsafe(LIST_COLUMNS)}
    from issues i
    join teams t on t.id = i.team_id
    left join users u on u.id = i.assignee_id
    left join projects p on p.id = i.project_id
    where t.workspace_id = ${ctx.workspaceId}
      and i.assignee_id = ${userId}
      and i.status not in ('done', 'canceled')
    order by i.updated_at desc, i.id desc
    limit ${limit}`;
  return rows as unknown as IssueListRow[];
}

/** Conteo Inbox: mismo filtro que listInboxIssues (badge del Sidebar). */
export async function countInboxIssues(
  ctx: QueryContext,
  userId: string,
): Promise<number> {
  const sql = getSql();
  const rows = await sql`select count(*)::int as count
    from issues i
    join teams t on t.id = i.team_id
    where t.workspace_id = ${ctx.workspaceId}
      and i.assignee_id = ${userId}
      and i.status not in ('done', 'canceled')`;
  return first(rows as unknown as Array<{ count: number }>)?.count ?? 0;
}

/** My issues: todo lo asignado a mí (salvo canceled), por updated_at desc. */
export async function listMyIssues(
  ctx: QueryContext,
  userId: string,
  limit = 50,
): Promise<IssueListRow[]> {
  const sql = getSql();
  const rows = await sql`select ${sql.unsafe(LIST_COLUMNS)}
    from issues i
    join teams t on t.id = i.team_id
    left join users u on u.id = i.assignee_id
    left join projects p on p.id = i.project_id
    where t.workspace_id = ${ctx.workspaceId}
      and i.assignee_id = ${userId}
      and i.status <> 'canceled'
    order by i.updated_at desc, i.id desc
    limit ${limit}`;
  return rows as unknown as IssueListRow[];
}

/**
 * Reviews: cola de `review` del workspace; lo mío primero
 * (sin tabla de reviewers, assignee es el proxy).
 */
export async function listReviewIssues(
  ctx: QueryContext,
  userId: string,
  limit = 50,
): Promise<IssueListRow[]> {
  const sql = getSql();
  const rows = await sql`select ${sql.unsafe(LIST_COLUMNS)}
    from issues i
    join teams t on t.id = i.team_id
    left join users u on u.id = i.assignee_id
    left join projects p on p.id = i.project_id
    where t.workspace_id = ${ctx.workspaceId}
      and i.status = 'review'
    order by case when i.assignee_id = ${userId} then 0 else 1 end,
      i.updated_at desc, i.id desc
    limit ${limit}`;
  return rows as unknown as IssueListRow[];
}

/** Conteo Reviews: misma cola que listReviewIssues (badge del Sidebar). */
export async function countReviewIssues(
  ctx: QueryContext,
  _userId: string,
): Promise<number> {
  const sql = getSql();
  const rows = await sql`select count(*)::int as count
    from issues i
    join teams t on t.id = i.team_id
    where t.workspace_id = ${ctx.workspaceId}
      and i.status = 'review'`;
  return first(rows as unknown as Array<{ count: number }>)?.count ?? 0;
}

export interface PulseItem {
  kind: "history" | "comment";
  id: string;
  created_at: string;
  actor_name: string | null;
  issue_id: string;
  team_id: string;
  identifier: string;
  issue_title: string;
  summary: string;
}

/** Pulse: últimas 20 actividades (history + comments) del workspace. */
export async function listPulseActivity(
  ctx: QueryContext,
  limit = 20,
): Promise<PulseItem[]> {
  const sql = getSql();
  const rows = await sql`(
    select 'history' as kind, h.id, h.created_at, u.name as actor_name,
      i.id as issue_id, i.team_id, t.key || '-' || i.number as identifier,
      i.title as issue_title,
      ('campo ' || h.field || ': ' || coalesce(h.old_value, '—') || ' → ' || coalesce(h.new_value, '—')) as summary
    from issue_history h
    join issues i on i.id = h.issue_id
    join teams t on t.id = i.team_id
    left join users u on u.id = h.actor_id
    where t.workspace_id = ${ctx.workspaceId}
  ) union all (
    select 'comment' as kind, c.id, c.created_at, u.name as actor_name,
      i.id as issue_id, i.team_id, t.key || '-' || i.number as identifier,
      i.title as issue_title,
      substring(c.body for 140) as summary
    from comments c
    join issues i on i.id = c.issue_id
    join teams t on t.id = i.team_id
    left join users u on u.id = c.author_id
    where t.workspace_id = ${ctx.workspaceId}
  )
  order by created_at desc, id desc
  limit ${limit}`;
  return rows as unknown as PulseItem[];
}
