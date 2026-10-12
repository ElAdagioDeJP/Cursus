/** queries.ts teams — solo SQL, sin next/*. */
import { first, getSql, one } from "@/db/client";
import type { TeamRow } from "@/db/types";
import type { CreateTeamInput } from "../workspaces/schema";

export async function listTeams(workspaceId: string) {
  const sql = getSql();
  const rows =
    await sql`select t.*, (select count(*)::int from issues i where i.team_id = t.id and i.status not in ('done','canceled')) as open_count
    from teams t where t.workspace_id = ${workspaceId} order by t.name`;
  return rows as unknown as Array<TeamRow & { open_count: number }>;
}

export async function getTeam(workspaceId: string, teamId: string) {
  const sql = getSql();
  const rows =
    await sql`select * from teams where id = ${teamId} and workspace_id = ${workspaceId}`;
  return (first(rows as unknown as TeamRow[]) ?? null) as TeamRow | null;
}

export async function createTeam(workspaceId: string, input: CreateTeamInput) {
  const sql = getSql();
  const rows = await sql`insert into teams (workspace_id, name, key)
    values (${workspaceId}, ${input.name}, ${input.key}) returning *`;
  return one(rows as unknown as TeamRow[], "Equipo");
}
