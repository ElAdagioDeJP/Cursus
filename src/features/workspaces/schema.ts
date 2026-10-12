import { z } from "zod";

export const CreateWorkspaceSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]{2,30}$/, "slug 2-30 [a-z0-9-]"),
    name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  })
  .strict();
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;

export const CreateTeamSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    key: z
      .string()
      .trim()
      .regex(/^[A-Z]{2,6}$/, "key [A-Z]{2,6}"),
  })
  .strict();
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;

export const CreateProjectSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    key: z
      .string()
      .trim()
      .regex(/^[A-Z]{2,6}$/, "key [A-Z]{2,6}"),
    description: z.string().max(5000).default(""),
    teamIds: z.array(z.uuid()).max(20).default([]),
  })
  .strict();
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
