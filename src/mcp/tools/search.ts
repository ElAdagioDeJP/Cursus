/** Tool MCP de búsqueda (1/15): FTS español con tope 25. */
import { z } from "zod";
import { searchIssues } from "@/features/issues/queries";
import type { ToolDef } from "./issues";

export const searchTools: ToolDef[] = [
  {
    name: "cursus_search",
    description: "Búsqueda full-text (español) en el workspace. Tope 25.",
    scope: "read",
    kind: "read",
    input: z
      .object({
        query: z.string().trim().min(2, "Mínimo 2 caracteres").max(200),
        limit: z.number().int().min(1).max(25).default(10),
      })
      .strict(),
    run: async (ctx, raw) => {
      const input = raw as { query: string; limit: number };
      const rows = await searchIssues(
        { userId: null, workspaceId: ctx.workspaceId },
        input.query,
        input.limit,
      );
      return {
        results: rows.map((r) => ({
          id: r.id,
          identifier: r.identifier,
          title: r.title,
          status: r.status,
          team: r.team_key,
        })),
      };
    },
  },
];
