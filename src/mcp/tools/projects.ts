/** Tools MCP de proyectos, etiquetas y equipos (4/15). */
import { z } from "zod";
import { createLabel } from "@/features/issues/queries";
import {
  createProject,
  listProjects,
  updateProject,
} from "@/features/projects/queries";
import { listTeams } from "@/features/teams/queries";
import type { ToolDef } from "./issues";

export const projectTools: ToolDef[] = [
  {
    name: "cursus_create_project",
    description: "Crea un proyecto. Devuelve id, key y url.",
    scope: "issues:write",
    kind: "write",
    input: z
      .object({
        name: z.string().trim().min(2).max(80),
        key: z
          .string()
          .regex(/^[A-Z]{2,6}$/)
          .describe("Clave [A-Z]{2,6}"),
        description: z.string().max(5000).default(""),
        teamIds: z.array(z.uuid()).max(20).default([]),
        clientMutationId: z.string().max(100).nullish(),
      })
      .strict(),
    run: async (ctx, raw) => {
      const input = raw as {
        name: string;
        key: string;
        description: string;
        teamIds: string[];
      };
      const project = await createProject(ctx.workspaceId, input);
      return {
        id: project.id,
        key: project.key,
        url: `${ctx.appUrl}/${ctx.workspaceSlug}/teams/${input.teamIds[0] ?? ""}/projects/${project.id}`,
      };
    },
  },
  {
    name: "cursus_update_project",
    description:
      "Actualiza nombre, clave o descripción de un proyecto. Devuelve id, key y name.",
    scope: "issues:write",
    kind: "write",
    input: z
      .object({
        id: z.uuid().describe("UUID del proyecto"),
        name: z.string().trim().min(2).max(80).nullish(),
        key: z
          .string()
          .regex(/^[A-Z]{2,6}$/)
          .describe("Clave [A-Z]{2,6}")
          .nullish(),
        description: z.string().max(5000).nullish(),
        clientMutationId: z.string().max(100).nullish(),
      })
      .strict()
      .refine(
        (v) => v.name != null || v.key != null || v.description != null,
        "Indica al menos uno de: name, key, description.",
      ),
    run: async (ctx, raw) => {
      const input = raw as {
        id: string;
        name?: string | null;
        key?: string | null;
        description?: string | null;
      };
      const project = await updateProject(ctx.workspaceId, input.id, {
        ...(input.name != null ? { name: input.name } : {}),
        ...(input.key != null ? { key: input.key } : {}),
        ...(input.description != null
          ? { description: input.description }
          : {}),
      });
      return { id: project.id, key: project.key, name: project.name };
    },
  },
  {
    name: "cursus_list_projects",
    description: "Lista proyectos del workspace (tope 50).",
    scope: "read",
    kind: "read",
    input: z
      .object({ limit: z.number().int().min(1).max(50).default(50) })
      .strict(),
    run: async (ctx, raw) => {
      const projects = await listProjects(
        ctx.workspaceId,
        (raw as { limit: number }).limit,
      );
      return {
        projects: projects.map((p) => ({
          id: p.id,
          key: p.key,
          name: p.name,
          teams: p.team_keys,
        })),
      };
    },
  },
  {
    name: "cursus_create_label",
    description: "Crea o actualiza una etiqueta del workspace.",
    scope: "issues:write",
    kind: "write",
    input: z
      .object({
        name: z.string().trim().min(1).max(40),
        color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .describe("Color hex"),
        clientMutationId: z.string().max(100).nullish(),
      })
      .strict(),
    run: async (ctx, raw) => {
      const input = raw as { name: string; color: string };
      const label = await createLabel(
        { userId: null, workspaceId: ctx.workspaceId },
        input,
      );
      return { id: label.id, name: label.name, color: label.color };
    },
  },
  {
    name: "cursus_list_teams",
    description: "Lista equipos del workspace con conteo de abiertas.",
    scope: "read",
    kind: "read",
    input: z.object({}).strict(),
    run: async (ctx) => {
      const teams = await listTeams(ctx.workspaceId);
      return {
        teams: teams.map((t) => ({
          id: t.id,
          key: t.key,
          name: t.name,
          openIssues: t.open_count,
        })),
      };
    },
  },
];
