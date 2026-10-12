/**
 * Tools MCP de issues (10/15). Reutilizan features/issues/queries (sin duplicar SQL).
 * Validación zod .strict() + .describe() para el inputSchema JSON.
 */
import { z } from "zod";
import { getSql } from "@/db/client";
import {
  addComment,
  assignIssue,
  createIssue,
  deleteIssue,
  getIssue,
  listIssues,
  moveIssue,
  setPriority,
  updateIssue,
} from "@/features/issues/queries";
import {
  EstimatePointsSchema,
  PrioritySchema,
  StatusEnum,
} from "@/features/issues/schema";
import type { McpScope } from "../auth";
import type { BucketKind } from "../ratelimit";

export interface McpQueryContext {
  userId: null;
  workspaceId: string;
  workspaceSlug: string;
  appUrl: string;
}

export interface ToolDef {
  name: string;
  description: string;
  scope: McpScope;
  kind: BucketKind;
  input: z.ZodType;
  run: (
    ctx: McpQueryContext,
    input: Record<string, unknown>,
  ) => Promise<unknown>;
}

const TeamRef = z
  .object({
    teamId: z.uuid().describe("UUID del equipo").nullish(),
    teamKey: z
      .string()
      .regex(/^[A-Z]{2,6}$/)
      .describe("Clave del equipo (ej CUR)")
      .nullish(),
  })
  .strict();

async function resolveTeam(
  ctx: McpQueryContext,
  ref: { teamId?: string | null; teamKey?: string | null },
) {
  const sql = getSql();
  if (ref.teamId) {
    const rows =
      await sql`select id, key from teams where id = ${ref.teamId} and workspace_id = ${ctx.workspaceId}`;
    const t = rows[0] as { id: string; key: string } | undefined;
    if (!t) throw new Error("Equipo no encontrado en este workspace.");
    return { id: String(t.id), key: String(t.key) };
  }
  if (ref.teamKey) {
    const rows =
      await sql`select id, key from teams where key = ${ref.teamKey} and workspace_id = ${ctx.workspaceId}`;
    const t = rows[0] as { id: string; key: string } | undefined;
    if (!t) throw new Error("Equipo no encontrado en este workspace.");
    return { id: String(t.id), key: String(t.key) };
  }
  throw new Error("Indica teamId o teamKey.");
}

async function resolveProjectKey(
  ctx: McpQueryContext,
  projectKey?: string | null,
) {
  if (!projectKey) return null;
  const sql = getSql();
  const rows =
    await sql`select id from projects where key = ${projectKey} and workspace_id = ${ctx.workspaceId}`;
  const p = rows[0] as { id: string } | undefined;
  if (!p) throw new Error("Proyecto no encontrado en este workspace.");
  return String(p.id);
}

async function resolveLabelNames(ctx: McpQueryContext, names?: string[]) {
  if (!names?.length) return [];
  const sql = getSql();
  const rows =
    await sql`select id from labels where workspace_id = ${ctx.workspaceId} and name = ANY(${names})`;
  return (rows as unknown as Array<{ id: string }>).map((r) => String(r.id));
}

function issueUrl(ctx: McpQueryContext, teamId: string, id: string) {
  return `${ctx.appUrl}/${ctx.workspaceSlug}/teams/${teamId}/issues/${id}`;
}

function lean(issue: Record<string, unknown>) {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    assignee: issue.assignee_name ?? null,
    labels: issue.label_names ?? [],
  };
}

export const issueTools: ToolDef[] = [
  {
    name: "cursus_create_issue",
    description:
      "Crea una incidencia en un equipo. Devuelve id, identifier y url.",
    scope: "issues:write",
    kind: "write",
    input: z
      .object({
        title: z.string().trim().min(3).max(200).describe("Título (3-200)"),
        description: z.string().max(20000).default("").describe("Descripción"),
        teamId: TeamRef.shape.teamId,
        teamKey: TeamRef.shape.teamKey,
        projectId: z.uuid().nullish().describe("UUID del proyecto"),
        projectKey: z
          .string()
          .regex(/^[A-Z]{2,6}$/)
          .nullish()
          .describe("Clave del proyecto"),
        priority: PrioritySchema.default(3).describe(
          "0=None,1=Urgent,2=High,3=Medium,4=Low",
        ),
        estimatePoints: EstimatePointsSchema.describe(
          "XS=1,S=2,M=3,L=5,XL=8,XXL=13,XXXL=21",
        ),
        assigneeId: z.uuid().nullish().describe("UUID del asignado"),
        labelNames: z
          .array(z.string().max(40))
          .max(20)
          .default([])
          .describe("Etiquetas por nombre"),
        dueDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullish()
          .describe("Vence YYYY-MM-DD"),
        clientMutationId: z
          .string()
          .max(100)
          .nullish()
          .describe("Idempotencia"),
      })
      .strict()
      .refine((v) => v.teamId ?? v.teamKey, "Indica teamId o teamKey"),
    run: async (ctx, raw) => {
      const input = raw as {
        title: string;
        description: string;
        teamId?: string | null;
        teamKey?: string | null;
        projectId?: string | null;
        projectKey?: string | null;
        priority: number;
        estimatePoints?: number | null;
        assigneeId?: string | null;
        labelNames: string[];
        dueDate?: string | null;
      };
      const team = await resolveTeam(ctx, input);
      const projectId =
        input.projectId ?? (await resolveProjectKey(ctx, input.projectKey));
      const labelIds = await resolveLabelNames(ctx, input.labelNames);
      const res = await createIssue(
        { userId: null, workspaceId: ctx.workspaceId },
        {
          teamId: team.id,
          projectId,
          parentId: null,
          title: input.title,
          description: input.description,
          priority: input.priority,
          estimatePoints: (input.estimatePoints ?? null) as
            | 1
            | 2
            | 3
            | 5
            | 8
            | 13
            | 21
            | null
            | undefined,
          assigneeId: input.assigneeId ?? null,
          labelIds,
          dueDate: input.dueDate ?? null,
        },
      );
      return {
        id: res.id,
        identifier: res.identifier,
        url: issueUrl(ctx, res.teamId, res.id),
      };
    },
  },
  {
    name: "cursus_list_issues",
    description:
      "Lista incidencias de un equipo con filtros y paginación keyset.",
    scope: "read",
    kind: "read",
    input: z
      .object({
        teamId: TeamRef.shape.teamId,
        teamKey: TeamRef.shape.teamKey,
        status: z
          .array(StatusEnum)
          .max(6)
          .nullish()
          .describe("Filtrar por estados"),
        limit: z.number().int().min(1).max(50).default(25).describe("Tope 50"),
        cursor: z.string().max(500).nullish(),
      })
      .strict()
      .refine((v) => v.teamId ?? v.teamKey, "Indica teamId o teamKey"),
    run: async (ctx, raw) => {
      const input = raw as {
        teamId?: string | null;
        teamKey?: string | null;
        status?: Array<
          "backlog" | "todo" | "in_progress" | "review" | "done" | "canceled"
        > | null;
        limit: number;
        cursor?: string | null;
      };
      const team = await resolveTeam(ctx, input);
      const { issues, nextCursor } = await listIssues(
        { userId: null, workspaceId: ctx.workspaceId },
        team.id,
        {
          status: input.status ?? undefined,
          limit: input.limit,
          cursor: input.cursor ?? undefined,
        },
      );
      return {
        issues: issues.map((i) =>
          lean(i as unknown as Record<string, unknown>),
        ),
        nextCursor,
      };
    },
  },
  {
    name: "cursus_get_issue",
    description: "Detalle completo por id o identifier (ej CUR-123).",
    scope: "read",
    kind: "read",
    input: z
      .object({ id: z.string().min(3).max(100).describe("UUID o identifier") })
      .strict(),
    run: async (ctx, raw) => {
      const full = await getIssue(
        { userId: null, workspaceId: ctx.workspaceId },
        (raw as { id: string }).id,
      );
      if (!full) throw new Error("Issue no encontrado en este workspace.");
      const f = full as unknown as Record<string, unknown>;
      return {
        ...f,
        url: issueUrl(
          ctx,
          String((f as { team_id: string }).team_id),
          String(f.id),
        ),
      };
    },
  },
  {
    name: "cursus_update_status",
    description:
      "Mueve una incidencia de estado (conserva orden si no se indica sort_key).",
    scope: "issues:write",
    kind: "write",
    input: z
      .object({
        id: z.string().min(3).max(100).describe("UUID o identifier"),
        status: StatusEnum.describe("Nuevo estado"),
        sortKey: z
          .string()
          .regex(/^\d{10}(\.\d+)?$/)
          .nullish()
          .describe("Clave de orden (opcional)"),
        clientMutationId: z.string().max(100).nullish(),
      })
      .strict(),
    run: async (ctx, raw) => {
      const input = raw as {
        id: string;
        status:
          | "backlog"
          | "todo"
          | "in_progress"
          | "review"
          | "done"
          | "canceled";
        sortKey?: string | null;
      };
      const qctx = { userId: null as null, workspaceId: ctx.workspaceId };
      const current = await getIssue(qctx, input.id);
      if (!current) throw new Error("Issue no encontrado en este workspace.");
      const c = current as unknown as { id: string; sort_key: string };
      const res = await moveIssue(qctx, {
        id: c.id,
        toStatus: input.status,
        toSortKey: input.sortKey ?? c.sort_key,
      });
      return {
        id: res.id,
        identifier: res.identifier,
        oldStatus: res.oldStatus,
        newStatus: res.newStatus,
      };
    },
  },
  {
    name: "cursus_update_issue",
    description:
      "Actualiza título, descripción, prioridad, estimación, vencimiento o proyecto.",
    scope: "issues:write",
    kind: "write",
    input: z
      .object({
        id: z.string().min(3).max(100),
        title: z.string().trim().min(3).max(200).nullish(),
        description: z.string().max(20000).nullish(),
        priority: PrioritySchema.nullish(),
        estimatePoints: EstimatePointsSchema,
        dueDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullish(),
        projectId: z.uuid().nullish(),
        clientMutationId: z.string().max(100).nullish(),
      })
      .strict(),
    run: async (ctx, raw) => {
      const input = raw as {
        id: string;
        title?: string | null;
        description?: string | null;
        priority?: number | null;
        estimatePoints?: number | null;
        dueDate?: string | null;
        projectId?: string | null;
      };
      return updateIssue(
        { userId: null, workspaceId: ctx.workspaceId },
        {
          id: input.id,
          ...(input.title != null ? { title: input.title } : {}),
          ...(input.description != null
            ? { description: input.description }
            : {}),
          ...(input.priority != null ? { priority: input.priority } : {}),
          estimatePoints: (input.estimatePoints ?? null) as
            | 1
            | 2
            | 3
            | 5
            | 8
            | 13
            | 21
            | null
            | undefined,
          dueDate: input.dueDate ?? null,
          projectId: input.projectId ?? null,
        },
      );
    },
  },
  {
    name: "cursus_add_comment",
    description: "Añade un comentario (máx 10.000 caracteres).",
    scope: "issues:write",
    kind: "write",
    input: z
      .object({
        issueId: z.string().min(3).max(100),
        body: z.string().trim().min(1).max(10000),
        clientMutationId: z.string().max(100).nullish(),
      })
      .strict(),
    run: async (ctx, raw) => {
      const input = raw as { issueId: string; body: string };
      const res = await addComment(
        { userId: null, workspaceId: ctx.workspaceId },
        input,
      );
      return { commentId: (res.comment as { id: string }).id };
    },
  },
  {
    name: "cursus_assign_issue",
    description:
      "Asigna (o libera con null) una incidencia a un miembro del workspace.",
    scope: "issues:write",
    kind: "write",
    input: z
      .object({
        id: z.string().min(3).max(100),
        assigneeId: z.uuid().nullable().describe("null libera"),
      })
      .strict(),
    run: async (ctx, raw) => {
      const input = raw as { id: string; assigneeId: string | null };
      return assignIssue({ userId: null, workspaceId: ctx.workspaceId }, input);
    },
  },
  {
    name: "cursus_set_priority",
    description: "Cambia la prioridad (0-4).",
    scope: "issues:write",
    kind: "write",
    input: z
      .object({ id: z.string().min(3).max(100), priority: PrioritySchema })
      .strict(),
    run: async (ctx, raw) => {
      const input = raw as { id: string; priority: number };
      return setPriority({ userId: null, workspaceId: ctx.workspaceId }, input);
    },
  },
  {
    name: "cursus_bulk_update_status",
    description:
      "Cambia el estado de hasta 20 incidencias. Exige confirmed:true.",
    scope: "issues:write",
    kind: "bulk",
    input: z
      .object({
        ids: z.array(z.string().min(3).max(100)).min(1).max(20),
        status: StatusEnum,
        confirmed: z.literal(true).describe("Confirmación obligatoria"),
        clientMutationId: z.string().max(100).nullish(),
      })
      .strict(),
    run: async (ctx, raw) => {
      const input = raw as {
        ids: string[];
        status:
          | "backlog"
          | "todo"
          | "in_progress"
          | "review"
          | "done"
          | "canceled";
      };
      const qctx = { userId: null as null, workspaceId: ctx.workspaceId };
      const updated: string[] = [];
      const failed: Array<{ id: string; error: string }> = [];
      for (const id of input.ids) {
        try {
          const current = await getIssue(qctx, id);
          if (!current) throw new Error("no encontrado");
          const c = current as unknown as { id: string; sort_key: string };
          await moveIssue(qctx, {
            id: c.id,
            toStatus: input.status,
            toSortKey: c.sort_key,
          });
          updated.push(id);
        } catch (err) {
          failed.push({
            id,
            error: err instanceof Error ? err.message : "error",
          });
        }
      }
      return { updated, failed };
    },
  },
  {
    name: "cursus_delete_issue",
    description: "Archiva (soft, pasa a canceled). Exige confirmed:true.",
    scope: "issues:delete",
    kind: "write",
    input: z
      .object({ id: z.string().min(3).max(100), confirmed: z.literal(true) })
      .strict(),
    run: async (ctx, raw) => {
      return deleteIssue(
        { userId: null, workspaceId: ctx.workspaceId },
        (raw as { id: string }).id,
      );
    },
  },
];
