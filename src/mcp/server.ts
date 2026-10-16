/**
 * Dispatcher MCP (§7.1): JSON-RPC 2.0 sobre POST único (stateless, JSON response).
 * Sin SDK: protocolo mínimo válido (initialize, tools/*, resources/*, prompts/*, ping).
 */
import { z } from "zod";
import { getSql } from "@/db/client";
import { getIssue } from "@/features/issues/queries";
import { listProjects } from "@/features/projects/queries";
import { type McpContext, requireScope } from "./auth";
import { issueTools, type McpQueryContext, type ToolDef } from "./tools/issues";
import { projectTools } from "./tools/projects";
import { searchTools } from "./tools/search";

export const TOOLS: ToolDef[] = [
  ...issueTools,
  ...projectTools,
  ...searchTools,
];

export const PROTOCOL_VERSION = "2025-06-18";
export const SERVER_INFO = { name: "cursus", version: "0.1.0" };

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function toolContext(ctx: McpContext): Promise<McpQueryContext> {
  const sql = getSql();
  const rows =
    await sql`select slug from workspaces where id = ${ctx.workspaceId}`;
  const ws = rows[0] as { slug: string } | undefined;
  if (!ws) throw new Error("Workspace no encontrado.");
  return {
    userId: null,
    workspaceId: ctx.workspaceId,
    workspaceSlug: String(ws.slug),
    appUrl: appUrl(),
  };
}

export function toolInputSchemas(): Array<{
  name: string;
  description: string;
  inputSchema: unknown;
}> {
  return TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: z.toJSONSchema(t.input as z.ZodType),
  }));
}

/** Validación pura (sin DB): nombre + schema. Lanza ZodError o Error conocido. */
export function validateToolCall(
  name: string,
  input: unknown,
): { tool: ToolDef; parsed: unknown } {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool desconocida: ${name}.`);
  return { tool, parsed: tool.input.parse(input) };
}

async function audit(
  ctx: McpContext,
  tool: string,
  input: unknown,
  mutationId: string | null,
  status: "ok" | "error" | "denied" | "rate_limited",
  result: unknown,
  error: string | null,
  durationMs: number,
): Promise<void> {
  const sql = getSql();
  await sql`insert into mcp_audit (key_id, workspace_id, tool, input, client_mutation_id, result, status, error, duration_ms)
    values (${ctx.keyId}, ${ctx.workspaceId}, ${tool}, ${JSON.stringify(input ?? {})},
      ${mutationId}, ${result === undefined ? null : JSON.stringify(result)},
      ${status}, ${error}, ${durationMs})
    on conflict (key_id, tool, client_mutation_id) do nothing`;
}

export async function callTool(
  ctx: McpContext,
  name: string,
  input: Record<string, unknown>,
): Promise<{ result: unknown; replay: boolean }> {
  const started = Date.now();
  const { tool, parsed } = validateToolCall(name, input);
  requireScope(ctx, tool.scope);
  const qctx = await toolContext(ctx);
  const mutationId =
    typeof input.clientMutationId === "string" && input.clientMutationId
      ? input.clientMutationId
      : null;

  if (mutationId) {
    const sql = getSql();
    const prev = await sql`select result from mcp_audit
      where key_id = ${ctx.keyId} and tool = ${name} and client_mutation_id = ${mutationId} and status = 'ok'`;
    const hit = prev[0] as { result: unknown } | undefined;
    if (hit)
      return {
        result:
          typeof hit.result === "string" ? JSON.parse(hit.result) : hit.result,
        replay: true,
      };
  }

  try {
    const result = await tool.run(qctx, parsed as Record<string, unknown>);
    await audit(
      ctx,
      name,
      input,
      mutationId,
      "ok",
      result,
      null,
      Date.now() - started,
    );
    return { result, replay: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    await audit(
      ctx,
      name,
      input,
      mutationId,
      "error",
      null,
      message,
      Date.now() - started,
    );
    throw err;
  }
}

// ---------- resources ----------

export async function listResources(ctx: McpContext) {
  return [
    {
      uri: "cursus://projects",
      name: "Proyectos del workspace",
      mimeType: "application/json",
    },
    {
      uri: "cursus://issues",
      name: "Últimas incidencias",
      mimeType: "application/json",
    },
  ].map((r) => ({ ...r, _workspace: ctx.workspaceId }));
}

export async function readResource(
  ctx: McpContext,
  uri: string,
): Promise<unknown> {
  if (uri === "cursus://projects") {
    const projects = await listProjects(ctx.workspaceId, 50);
    return projects.map((p) => ({ id: p.id, key: p.key, name: p.name }));
  }
  if (uri === "cursus://issues") {
    const sql = getSql();
    const rows =
      await sql`select i.id, t.key || '-' || i.number as identifier, i.title, i.status
      from issues i join teams t on t.id = i.team_id
      where t.workspace_id = ${ctx.workspaceId} order by i.updated_at desc limit 20`;
    return rows;
  }
  const issueMatch = /^cursus:\/\/issues\/(.+)$/.exec(uri);
  if (issueMatch) {
    const full = await getIssue(
      { userId: null, workspaceId: ctx.workspaceId },
      issueMatch[1] as string,
    );
    if (!full) throw new Error("Recurso no encontrado.");
    return full;
  }
  const projectMatch = /^cursus:\/\/projects\/(.+)$/.exec(uri);
  if (projectMatch) {
    const projectId = projectMatch[1];
    if (!projectId) throw new Error("Recurso no encontrado.");
    const sql = getSql();
    const rows =
      await sql`select * from projects where id = ${projectId} and workspace_id = ${ctx.workspaceId}`;
    const p = rows[0] as Record<string, unknown> | undefined;
    if (!p) throw new Error("Recurso no encontrado.");
    return p;
  }
  throw new Error("Recurso no encontrado.");
}

// ---------- prompts ----------

const PROMPTS = [
  {
    name: "triage",
    description: "Clasifica el backlog: propone estado, prioridad y asignado.",
    arguments: [
      { name: "teamKey", description: "Clave del equipo", required: true },
    ],
  },
  {
    name: "plan-sprint",
    description: "Propone un plan con las abiertas priorizadas y estimadas.",
    arguments: [
      { name: "teamKey", description: "Clave del equipo", required: true },
    ],
  },
  {
    name: "spec-to-issues",
    description: "Convierte una especificación en incidencias creables.",
    arguments: [
      {
        name: "spec",
        description: "Texto de la especificación",
        required: true,
      },
    ],
  },
  {
    name: "roadmap-planning",
    description:
      "Convierte un brief en proyecto + issues por fase con relaciones related. Muestra el plan antes de crear.",
    arguments: [
      {
        name: "brief",
        description: "Documento o brief del roadmap",
        required: true,
      },
      { name: "teamKey", description: "Clave del equipo", required: true },
    ],
  },
];

export function listPrompts() {
  return PROMPTS;
}

export function getPrompt(
  name: string,
  args: Record<string, string>,
): { messages: unknown[] } {
  const found = PROMPTS.find((p) => p.name === name);
  if (!found) throw new Error(`Prompt desconocido: ${name}.`);
  const text: Record<string, string> = {
    triage: `Eres el triage de Cursus. Equipo ${args.teamKey ?? "?"}. Lista el backlog con cursus_list_issues, y para cada issue propón estado, prioridad (0-4) y asignado. Aplica cambios solo con cursus_update_status/cursus_assign_issue.`,
    "plan-sprint": `Eres el planificador de Cursus. Equipo ${args.teamKey ?? "?"}. Toma las abiertas ordenadas por prioridad y estimación, y propón un plan que quepa en una semana. No cambies nada sin confirmación.`,
    "spec-to-issues": `Eres el despiece de Cursus. Convierte esta especificación en incidencias (título 3-200, prioridad, estimación XS-XXXL): ${args.spec ?? ""}. Crea con cursus_create_issue solo tras revisar la lista.`,
    "roadmap-planning": `Eres el planificador de roadmap de Cursus. Equipo ${args.teamKey ?? "?"}. Lee este brief: ${args.brief ?? ""}. Propón UN proyecto (cursus_create_project) y sus issues por fase (cursus_create_issue con título 3-200, prioridad y estimación XS-XXXL; sin milestones reales, cada fase es un grupo de issues con prefijo [Fase N]). Muestra el plan completo ANTES de crear nada y espera confirmación. No inventes dependencias: solo marca como related lo que el brief declare explícito; nunca uses blocked/blocking/duplicate.`,
  };
  return {
    messages: [{ role: "user", content: { type: "text", text: text[name] } }],
  };
}

// ---------- dispatch ----------

export interface RpcEnvelope {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export function rpcOk(id: RpcEnvelope["id"], result: unknown) {
  return { jsonrpc: "2.0" as const, id: id ?? null, result };
}

export function rpcError(
  id: RpcEnvelope["id"],
  code: number,
  message: string,
  data?: unknown,
) {
  return {
    jsonrpc: "2.0" as const,
    id: id ?? null,
    error: { code, message, ...(data === undefined ? {} : { data }) },
  };
}
