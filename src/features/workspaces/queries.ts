/** queries.ts workspaces — solo SQL, sin next/*. */
import { first, getSql, one } from "@/db/client";
import type { MembershipRow, WorkspaceRow } from "@/db/types";
import type { CreateWorkspaceInput } from "./schema";

export async function getWorkspaceBySlug(slug: string) {
  const sql = getSql();
  const rows = await sql`select * from workspaces where slug = ${slug}`;
  return (first(rows as unknown as WorkspaceRow[]) ??
    null) as WorkspaceRow | null;
}

export async function listWorkspacesForUser(userId: string) {
  const sql = getSql();
  const rows = await sql`select w.*, m.role from workspaces w
    join memberships m on m.workspace_id = w.id
    where m.user_id = ${userId} order by w.name`;
  return rows as unknown as Array<
    WorkspaceRow & { role: MembershipRow["role"] }
  >;
}

export async function listMembers(workspaceId: string) {
  const sql = getSql();
  const rows =
    await sql`select u.id, u.name, u.email, u.image, m.role from memberships m
    join users u on u.id = m.user_id
    where m.workspace_id = ${workspaceId} order by u.name`;
  return rows as unknown as Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: MembershipRow["role"];
  }>;
}

export async function renameWorkspace(workspaceId: string, name: string) {
  const sql = getSql();
  const ws = one(
    (await sql`update workspaces set name = ${name} where id = ${workspaceId} returning *`) as unknown as WorkspaceRow[],
    "Workspace",
  );
  return ws;
}

export async function createWorkspace(
  userId: string,
  input: CreateWorkspaceInput,
) {
  const sql = getSql();
  return sql.begin(async (tx) => {
    const rows = (await tx`insert into workspaces (slug, name)
      values (${input.slug}, ${input.name}) returning *`) as unknown as WorkspaceRow[];
    const ws = one(rows, "Workspace");
    await tx`insert into memberships (user_id, workspace_id, role)
      values (${userId}, ${ws.id}, 'owner')`;
    return ws;
  });
}
