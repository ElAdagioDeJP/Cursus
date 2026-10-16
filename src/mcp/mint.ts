/**
 * CLI: crear clave MCP para un workspace.
 * Uso: bun src/mcp/mint.ts <workspace-slug> <nombre> [scopes...]
 * Imprime el secreto UNA vez (cur2_sk_…); en DB solo va el sha256.
 */
import { randomBytes } from "node:crypto";
import { getSql } from "../db/client";
import { ALL_SCOPES, hashToken } from "./auth";

const [slug, name, ...scopes] = process.argv.slice(2);
if (!slug || !name) {
  console.error(
    "Uso: bun src/mcp/mint.ts <workspace-slug> <nombre> [scopes...]",
  );
  process.exit(1);
}
const valid = scopes.length > 0 ? scopes : [...ALL_SCOPES];
for (const s of valid) {
  if (!(ALL_SCOPES as string[]).includes(s)) {
    console.error(`Scope inválido: ${s}. Válidos: ${ALL_SCOPES.join(", ")}`);
    process.exit(1);
  }
}

const secret = `cur2_sk_${randomBytes(24).toString("base64url")}`;
const sql = getSql();
const ws = await sql`select id from workspaces where slug = ${slug}`;
if (ws.length === 0) {
  console.error(`Workspace no encontrado: ${slug}`);
  process.exit(1);
}
await sql`insert into api_keys (workspace_id, name, key_hash, scopes)
  values (${String((ws[0] as { id: string }).id)}, ${name}, ${hashToken(secret)}, ${valid as string[]})`;
console.log(
  `Clave creada para ${slug} con scopes [${valid.join(", ")}]:\n${secret}\nGuárdala: no se vuelve a mostrar.`,
);
process.exit(0);
