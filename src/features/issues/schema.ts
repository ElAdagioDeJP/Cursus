/**
 * Esquemas zod de entrada (§2.2). Única fuente de validación:
 * se importan en el form cliente Y se re-parsean en la Server Action.
 */
import { z } from "zod";
import { SORT_KEY_RE } from "./lib/ordering";

export const StatusEnum = z.enum([
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
  "canceled",
]);
export type WorkflowStatus = z.infer<typeof StatusEnum>;

export const PrioritySchema = z.number().int().min(0).max(4);
export const EstimatePointsSchema = z
  .union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(5),
    z.literal(8),
    z.literal(13),
    z.literal(21),
  ])
  .nullish();
export const SortKeySchema = z.string().regex(SORT_KEY_RE, "sort_key inválido");
export const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "fecha YYYY-MM-DD")
  .nullish();

export const CreateIssueSchema = z
  .object({
    teamId: z.uuid(),
    projectId: z.uuid().nullish(),
    parentId: z.uuid().nullish(),
    title: z
      .string()
      .trim()
      .min(3, "Mínimo 3 caracteres")
      .max(200, "Máximo 200 caracteres"),
    description: z.string().max(20000).default(""),
    priority: PrioritySchema.default(3),
    estimatePoints: EstimatePointsSchema,
    assigneeId: z.uuid().nullish(),
    labelIds: z.array(z.uuid()).max(20).default([]),
    dueDate: DateSchema,
  })
  .strict();
export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;

export const MoveIssueSchema = z
  .object({ id: z.uuid(), toStatus: StatusEnum, toSortKey: SortKeySchema })
  .strict();
export type MoveIssueInput = z.infer<typeof MoveIssueSchema>;

export const UpdateIssueSchema = z
  .object({
    id: z.uuid(),
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().max(20000).optional(),
    priority: PrioritySchema.optional(),
    estimatePoints: EstimatePointsSchema,
    dueDate: DateSchema,
    projectId: z.uuid().nullish(),
  })
  .strict();
export type UpdateIssueInput = z.infer<typeof UpdateIssueSchema>;

export const AssignIssueSchema = z
  .object({ id: z.uuid(), assigneeId: z.uuid().nullable() })
  .strict();
export type AssignIssueInput = z.infer<typeof AssignIssueSchema>;
export const SetPrioritySchema = z
  .object({ id: z.uuid(), priority: PrioritySchema })
  .strict();
export type SetPriorityInput = z.infer<typeof SetPrioritySchema>;

export const AddCommentSchema = z
  .object({
    issueId: z.uuid(),
    body: z.string().trim().min(1).max(10000, "Máximo 10.000 caracteres"),
  })
  .strict();
export type AddCommentInput = z.infer<typeof AddCommentSchema>;

export const ListIssuesFiltersSchema = z
  .object({
    status: z.array(StatusEnum).max(6).optional(),
    assigneeId: z.string().optional(),
    projectId: z.uuid().optional(),
    q: z.string().trim().min(2, "Mínimo 2 caracteres").max(200).optional(),
    limit: z.number().int().min(1).max(50).default(25),
    cursor: z.string().max(500).optional(),
  })
  .strict();
export type ListIssuesFilters = z.infer<typeof ListIssuesFiltersSchema>;

export const CreateLabelSchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "color hex"),
  })
  .strict();
export type CreateLabelInput = z.infer<typeof CreateLabelSchema>;
