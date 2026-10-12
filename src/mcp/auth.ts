/**
 * Auth MCP (§7.1): Bearer cur2_sk_… (solo sha256 en DB) + scopes + filtro workspace.
 * Security: compara hash, nunca el secreto; respeta revocación.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { getSql } from "@/db/client";

export type McpScope = "read" | "issues:write" | "issues:delete";
export const ALL_SCOPES: McpScope[] = ["read", "issues:write", "issues:delete"];

export interface McpContext {
  keyId: string;
  workspaceId: string;
  scopes: McpScope[];
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class McpAuthError extends Error {
  status = 401;
}

export function extractBearer(req: Request): string {
  const header = req.headers.get("authorization");
  const m = /^Bearer\s+(cur2_sk_[A-Za-z0-9_-]{20,})$/i.exec(
    header?.trim() ?? "",
  );
  if (!m) throw new McpAuthError("Falta Authorization: Bearer cur2_sk_…");
  return m[1] as string;
}

export async function authenticateMcp(req: Request): Promise<McpContext> {
  const token = extractBearer(req);
  const digest = hashToken(token);
  const sql = getSql();
  const rows = await sql`select id, workspace_id, scopes, revoked_at, key_hash
    from api_keys where key_hash = ${digest}`;
  const row = rows[0] as
    | {
        id: string;
        workspace_id: string;
        scopes: string[];
        revoked_at: string | null;
        key_hash: string;
      }
    | undefined;
  if (!row || row.revoked_at)
    throw new McpAuthError("Clave inválida o revocada.");
  const a = Buffer.from(row.key_hash);
  const b = Buffer.from(digest);
  if (a.length !== b.length || !timingSafeEqual(a, b))
    throw new McpAuthError("Clave inválida.");
  await sql`update api_keys set last_used_at = now() where id = ${String(row.id)}`;
  return {
    keyId: String(row.id),
    workspaceId: String(row.workspace_id),
    scopes: (row.scopes as string[]).filter((s): s is McpScope =>
      (ALL_SCOPES as string[]).includes(s),
    ),
  };
}

export function requireScope(ctx: McpContext, scope: McpScope): void {
  if (!ctx.scopes.includes(scope)) {
    const err = new McpAuthError(`Scope insuficiente: se requiere ${scope}.`);
    err.status = 403;
    throw err;
  }
}
