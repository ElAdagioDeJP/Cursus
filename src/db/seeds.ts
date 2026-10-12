/**
 * Seeds SOLO dev (nunca en migraciones, §4.6).
 * Uso: bun run db:seed  — crea workspace demo + team CUR + proyecto + labels + issues.
 * Crea además usuario demo + sesión para E2E con bypass de cookie (sin OAuth real).
 */
import { randomBytes } from "node:crypto";
import { first, getSql, one } from "./client";

export async function seedDemo() {
  const sql = getSql();
  const ws = one(
    (await sql`insert into workspaces (slug, name)
      values ('demo', 'Demostración') on conflict (slug) do update set name = excluded.name returning id`) as Array<{
      id: string;
    }>,
    "Workspace",
  );
  const workspaceId = String(ws.id);

  const team = one(
    (await sql`insert into teams (workspace_id, name, key)
      values (${workspaceId}, 'Cursus', 'CUR') on conflict (workspace_id, key)
      do update set name = excluded.name returning id, key`) as Array<{
      id: string;
      key: string;
    }>,
    "Equipo",
  );
  const teamId = String(team.id);

  const project = one(
    (await sql`insert into projects (workspace_id, name, key, description)
      values (${workspaceId}, 'MVP', 'MVP', 'Alcance mínimo viable')
      on conflict (workspace_id, key) do update set name = excluded.name returning id`) as Array<{
      id: string;
    }>,
    "Proyecto",
  );
  const projectId = String(project.id);
  await sql`insert into project_teams (project_id, team_id) values (${projectId}, ${teamId}) on conflict do nothing`;

  const labelNames: Array<[string, string]> = [
    ["bug", "#ef4444"],
    ["feature", "#3b82f6"],
    ["chore", "#6b7280"],
  ];
  for (const [name, color] of labelNames) {
    await sql`insert into labels (workspace_id, name, color) values (${workspaceId}, ${name}, ${color})
      on conflict (workspace_id, name) do nothing`;
  }

  const existing = one(
    (await sql`select count(*)::int as n from issues where team_id = ${teamId}`) as Array<{
      n: number;
    }>,
    "Conteo",
  );
  if (existing.n === 0) {
    const seedIssues: Array<[string, string, number, string]> = [
      ["Configurar migraciones propias", "backlog", 2, "0000001024"],
      ["Tablero con drag and drop", "todo", 2, "0000002048"],
      ["Paleta de comandos Cmd+K", "in_progress", 3, "0000003072"],
      ["Servidor MCP cursus_", "todo", 3, "0000004096"],
      ["Deploy en Dokploy", "backlog", 4, "0000005120"],
    ];
    let n = 0;
    for (const [title, status, priority, sort] of seedIssues) {
      n += 1;
      await sql`insert into issues (team_id, project_id, title, status, priority, number, sort_key)
        values (${teamId}, ${projectId}, ${title}, ${status}, ${priority}, ${n}, ${sort})`;
    }
    await sql`update teams set next_issue_number = ${n + 1} where id = ${teamId}`;
  }
  console.log(`seed OK — workspace demo, team CUR, proyecto MVP.`);
}

/** Sesión E2E: usuario demo + token de sesión válido (bypass OAuth en tests). */
export async function createE2ESession(): Promise<{
  cookieValue: string;
  userId: string;
}> {
  const sql = getSql();
  const u = one(
    (await sql`insert into users (name, email) values ('E2E', 'e2e@cursus.local')
      on conflict (email) do update set name = excluded.name returning id`) as Array<{
      id: string;
    }>,
    "Usuario",
  );
  const userId = String(u.id);
  const ws = await sql`select id from workspaces where slug = 'demo'`;
  const demo = first(ws as unknown as Array<{ id: string }>);
  if (demo) {
    await sql`insert into memberships (user_id, workspace_id, role)
      values (${userId}, ${String(demo.id)}, 'owner') on conflict do nothing`;
  }
  const token = randomBytes(32).toString("hex");
  await sql`insert into sessions (session_token, user_id, expires)
    values (${token}, ${userId}, now() + interval '1 day')
    on conflict (session_token) do update set expires = excluded.expires`;
  return { cookieValue: token, userId };
}

if (
  typeof process !== "undefined" &&
  (process.argv[1] ?? "").replace(/\\/g, "/").endsWith("src/db/seeds.ts")
) {
  seedDemo().then(
    () => process.exit(0),
    (err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    },
  );
}
