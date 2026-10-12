/**
 * POST /api/mcp — servidor MCP Streamable HTTP, stateless, JSON response (§7.1).
 * Auth Bearer antes del handler + scopes + rate-limit + auditoría.
 */
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSql } from "@/db/client";
import { authenticateMcp, McpAuthError } from "@/mcp/auth";
import { checkRateLimit } from "@/mcp/ratelimit";
import {
  callTool,
  getPrompt,
  listPrompts,
  listResources,
  PROTOCOL_VERSION,
  type RpcEnvelope,
  readResource,
  rpcError,
  rpcOk,
  SERVER_INFO,
  toolInputSchemas,
  validateToolCall,
} from "@/mcp/server";

async function auditDenied(
  ctx: { keyId: string; workspaceId: string } | null,
  tool: string,
  input: unknown,
  status: "denied" | "rate_limited" | "error",
  error: string,
): Promise<void> {
  if (!ctx) return;
  const sql = getSql();
  await sql`insert into mcp_audit (key_id, workspace_id, tool, input, status, error, duration_ms)
    values (${ctx.keyId}, ${ctx.workspaceId}, ${tool}, ${JSON.stringify(input ?? {})}, ${status}, ${error}, 0)
    on conflict do nothing`;
}

async function handleOne(
  ctx: { keyId: string; workspaceId: string; scopes: string[] },
  env: RpcEnvelope,
) {
  const full = ctx as Parameters<typeof callTool>[0];
  switch (env.method) {
    case "initialize":
      return rpcOk(env.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: { listChanged: false },
          resources: {},
          prompts: {},
        },
        serverInfo: SERVER_INFO,
      });
    case "notifications/initialized":
    case "notifications/cancelled":
      return null;
    case "ping":
      return rpcOk(env.id, {});
    case "tools/list":
      return rpcOk(env.id, { tools: toolInputSchemas() });
    case "tools/call": {
      const params = env.params ?? {};
      const name = String(params.name ?? "");
      const input = (params.arguments ?? {}) as Record<string, unknown>;
      try {
        validateToolCall(name, input);
      } catch (err) {
        return rpcError(
          env.id,
          -32602,
          err instanceof Error ? err.message : "Parámetros inválidos.",
        );
      }
      const { kind } = (await import("@/mcp/server")).TOOLS.find(
        (t) => t.name === name,
      ) as { kind: "read" | "write" | "bulk" };
      const limit = await checkRateLimit(ctx.keyId, kind);
      if (!limit.allowed) {
        await auditDenied(ctx, name, input, "rate_limited", "Límite excedido.");
        return {
          __httpStatus: 429,
          __retryAfter: limit.retryAfterSec,
          __rpc: rpcError(env.id, -32000, "Límite excedido."),
        };
      }
      try {
        const { result } = await callTool(full, name, input);
        return rpcOk(env.id, {
          content: [{ type: "text", text: JSON.stringify(result) }],
        });
      } catch (err) {
        if (err instanceof McpAuthError) {
          await auditDenied(ctx, name, input, "denied", err.message);
          return rpcError(env.id, -32000, err.message);
        }
        if (err instanceof ZodError)
          return rpcError(env.id, -32602, "Parámetros inválidos.");
        return rpcError(
          env.id,
          -32603,
          err instanceof Error ? err.message : "Error interno.",
        );
      }
    }
    case "resources/list":
      return rpcOk(env.id, { resources: await listResources(full) });
    case "resources/read": {
      const uri = String(env.params?.uri ?? "");
      try {
        const data = await readResource(full, uri);
        return rpcOk(env.id, {
          contents: [
            { uri, mimeType: "application/json", text: JSON.stringify(data) },
          ],
        });
      } catch (err) {
        return rpcError(
          env.id,
          -32002,
          err instanceof Error ? err.message : "Recurso no encontrado.",
        );
      }
    }
    case "prompts/list":
      return rpcOk(env.id, { prompts: listPrompts() });
    case "prompts/get": {
      const p = env.params ?? {};
      try {
        return rpcOk(
          env.id,
          getPrompt(
            String(p.name ?? ""),
            (p.arguments ?? {}) as Record<string, string>,
          ),
        );
      } catch (err) {
        return rpcError(
          env.id,
          -32602,
          err instanceof Error ? err.message : "Prompt inválido.",
        );
      }
    }
    default:
      return rpcError(env.id, -32601, `Método no soportado: ${env.method}.`);
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, "JSON inválido."), {
      status: 400,
    });
  }

  let ctx: { keyId: string; workspaceId: string; scopes: string[] };
  try {
    ctx = await authenticateMcp(req);
  } catch (err) {
    const status = err instanceof McpAuthError ? err.status : 401;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No autorizado." },
      { status },
    );
  }

  const envelopes = (Array.isArray(body) ? body : [body]) as RpcEnvelope[];
  if (
    envelopes.some((e) => e?.jsonrpc !== "2.0" || typeof e?.method !== "string")
  ) {
    return NextResponse.json(rpcError(null, -32600, "Petición inválida."), {
      status: 400,
    });
  }

  const out = [];
  for (const env of envelopes) {
    // eslint-disable-next-line no-await-in-loop
    const res = await handleOne(ctx, env);
    if (res && typeof res === "object" && "__rpc" in res) {
      const r = res as {
        __httpStatus: number;
        __retryAfter: number;
        __rpc: unknown;
      };
      return NextResponse.json(r.__rpc, {
        status: r.__httpStatus,
        headers: { "Retry-After": String(r.__retryAfter) },
      });
    }
    if (res !== null) out.push(res);
  }
  if (envelopes.length === 1 && out.length === 0) {
    return new NextResponse(null, { status: 202 });
  }
  return NextResponse.json(Array.isArray(body) ? out : (out[0] ?? null));
}
