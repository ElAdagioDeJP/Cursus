/** queries.ts projects — solo SQL, sin next/*. */
import { first, getSql, one } from "@/db/client";
import type { IssueListRow, ProjectRow, TeamRow } from "@/db/types";
import type { CreateProjectInput } from "../workspaces/schema";

export async function listProjects(workspaceId: string, limit = 50) {
  const sql = getSql();
  const rows =
    await sql`select p.*, coalesce(array_agg(t.key) filter (where t.key is not null), '{}') as team_keys
    from projects p left join project_teams pt on pt.project_id = p.id
    left join teams t on t.id = pt.team_id
    where p.workspace_id = ${workspaceId}
    group by p.id order by p.name limit ${Math.min(limit, 50)}`;
  return rows as unknown as Array<ProjectRow & { team_keys: string[] }>;
}

export async function getProject(workspaceId: string, projectId: string) {
  const sql = getSql();
  const rows =
    await sql`select * from projects where id = ${projectId} and workspace_id = ${workspaceId}`;
  const project = first(rows as unknown as ProjectRow[]);
  if (!project) return null;
  const teams = (await sql`select t.* from project_teams pt
    join teams t on t.id = pt.team_id where pt.project_id = ${projectId}`) as unknown as TeamRow[];
  return { project, teams };
}

export async function createProject(
  workspaceId: string,
  input: CreateProjectInput,
) {
  const sql = getSql();
  return sql.begin(async (tx) => {
    const rows =
      (await tx`insert into projects (workspace_id, name, key, description)
      values (${workspaceId}, ${input.name}, ${input.key}, ${input.description}) returning *`) as unknown as ProjectRow[];
    const project = one(rows, "Proyecto");
    for (const teamId of input.teamIds) {
      await tx`insert into project_teams (project_id, team_id)
        select ${project.id}, ${teamId} from teams where id = ${teamId} and workspace_id = ${workspaceId}
        on conflict do nothing`;
    }
    return project;
  });
}

export interface UpdateProjectInput {
  name?: string;
  key?: string;
  description?: string;
}

export async function updateProject(
  workspaceId: string,
  projectId: string,
  input: UpdateProjectInput,
) {
  const sql = getSql();
  const existing = first(
    (await sql`select * from projects where id = ${projectId} and workspace_id = ${workspaceId}`) as unknown as ProjectRow[],
  );
  if (!existing) throw new Error("Proyecto no encontrado en este workspace.");
  const patch: { name?: string; key?: string; description?: string } = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 2 || name.length > 80)
      throw new Error("El nombre debe tener entre 2 y 80 caracteres.");
    patch.name = name;
  }
  if (input.key !== undefined) {
    if (!/^[A-Z]{2,6}$/.test(input.key))
      throw new Error("La clave debe cumplir [A-Z]{2,6}.");
    const clashes =
      await sql`select id from projects where workspace_id = ${workspaceId} and key = ${input.key} and id <> ${projectId} limit 1`;
    if (clashes.length > 0)
      throw new Error(
        `Ya existe otro proyecto con la clave ${input.key} en este workspace.`,
      );
    patch.key = input.key;
  }
  if (input.description !== undefined) {
    if (input.description.length > 5000)
      throw new Error("La descripción supera los 5000 caracteres.");
    patch.description = input.description;
  }
  if (
    patch.name === undefined &&
    patch.key === undefined &&
    patch.description === undefined
  ) {
    throw new Error("Indica al menos uno de: name, key, description.");
  }
  const rows =
    (await sql`update projects set name = coalesce(${patch.name ?? null}, name),
      key = coalesce(${patch.key ?? null}, key),
      description = coalesce(${patch.description ?? null}, description),
      updated_at = now()
      where id = ${projectId} and workspace_id = ${workspaceId} returning *`) as unknown as ProjectRow[];
  return one(rows, "Proyecto");
}

export async function listProjectIssues(
  workspaceId: string,
  projectId: string,
  limit = 50,
) {
  const sql = getSql();
  const rows =
    await sql`select i.*, t.key as team_key, t.key || '-' || i.number as identifier,
      u.name as assignee_name, p.key as project_key,
      coalesce((select array_agg(l.name order by l.name) from issue_labels il
        join labels l on l.id = il.label_id where il.issue_id = i.id), '{}') as label_names
    from issues i
    join teams t on t.id = i.team_id
    join projects p on p.id = i.project_id
    left join users u on u.id = i.assignee_id
    where p.id = ${projectId} and p.workspace_id = ${workspaceId}
    order by i.updated_at desc limit ${Math.min(limit, 50)}`;
  return rows as unknown as IssueListRow[];
}
