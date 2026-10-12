/**
 * actions.ts — thin wrappers "use server" (§3): zod + membership + SQL + revalidate + broadcast.
 * Solo expone lo público vía index.ts.
 */
"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireMembership } from "@/auth/guards";
import { canWrite } from "@/auth/roles";
import { broadcast } from "@/realtime/server";
import {
  addComment,
  assignIssue,
  createIssue,
  createLabel,
  deleteIssue,
  listIssues,
  moveIssue,
  searchIssues,
  setPriority,
  updateIssue,
} from "./queries";
import {
  AddCommentSchema,
  AssignIssueSchema,
  CreateIssueSchema,
  CreateLabelSchema,
  ListIssuesFiltersSchema,
  MoveIssueSchema,
  SetPrioritySchema,
  UpdateIssueSchema,
  type WorkflowStatus,
} from "./schema";

async function ctxFor(wsSlug: string) {
  const m = await requireMembership(wsSlug);
  if (!canWrite(m.role))
    throw new Error("Sin permiso de escritura en este workspace.");
  return { userId: m.userId, workspaceId: m.workspaceId };
}

const teamTag = (teamId: string) => `issues:team:${teamId}`;

export async function createIssueAction(wsSlug: string, input: unknown) {
  const ctx = await ctxFor(wsSlug);
  const parsed = CreateIssueSchema.parse(input);
  const res = await createIssue(ctx, parsed);
  updateTag(teamTag(res.teamId));
  await broadcast(`team:${res.teamId}`, "issues:changed");
  return res;
}

export async function moveIssueAction(wsSlug: string, input: unknown) {
  const ctx = await ctxFor(wsSlug);
  const parsed = MoveIssueSchema.parse(input);
  const res = await moveIssue(ctx, parsed);
  updateTag(teamTag(res.teamId));
  await broadcast(`team:${res.teamId}`, "issues:changed");
  return res;
}

export async function updateIssueAction(wsSlug: string, input: unknown) {
  const ctx = await ctxFor(wsSlug);
  const parsed = UpdateIssueSchema.parse(input);
  return updateIssue(ctx, parsed);
}

export async function assignIssueAction(wsSlug: string, input: unknown) {
  const ctx = await ctxFor(wsSlug);
  const parsed = AssignIssueSchema.parse(input);
  const res = await assignIssue(ctx, parsed);
  updateTag(teamTag(res.teamId));
  await broadcast(`team:${res.teamId}`, "issues:changed");
  return res;
}

export async function setPriorityAction(wsSlug: string, input: unknown) {
  const ctx = await ctxFor(wsSlug);
  const parsed = SetPrioritySchema.parse(input);
  const res = await setPriority(ctx, parsed);
  updateTag(teamTag(res.teamId));
  return res;
}

export async function deleteIssueAction(
  wsSlug: string,
  id: string,
  confirmed: boolean,
) {
  if (!confirmed) throw new Error("Borrado no confirmado.");
  const ctx = await ctxFor(wsSlug);
  const res = await deleteIssue(ctx, id);
  updateTag(teamTag(res.teamId));
  await broadcast(`team:${res.teamId}`, "issues:changed");
  return res;
}

export async function addCommentAction(wsSlug: string, input: unknown) {
  const ctx = await ctxFor(wsSlug);
  const parsed = AddCommentSchema.parse(input);
  const res = await addComment(ctx, parsed);
  updateTag(teamTag(res.teamId));
  return res;
}

export async function createLabelAction(wsSlug: string, input: unknown) {
  const ctx = await ctxFor(wsSlug);
  return createLabel(ctx, CreateLabelSchema.parse(input));
}

export async function listIssuesAction(
  wsSlug: string,
  teamId: string,
  filters: unknown,
  status?: WorkflowStatus[],
) {
  const m = await requireMembership(wsSlug);
  void status;
  const parsed = ListIssuesFiltersSchema.parse(filters);
  return listIssues(
    { userId: m.userId, workspaceId: m.workspaceId },
    teamId,
    parsed,
  );
}

/** Búsqueda para la paleta Cmd+K (S3). Tope 25 (§7). */
export async function searchIssuesAction(
  wsSlug: string,
  query: unknown,
  limit = 8,
) {
  const m = await requireMembership(wsSlug);
  const q = z.string().trim().min(2).max(200).parse(query);
  return searchIssues(
    { userId: m.userId, workspaceId: m.workspaceId },
    q,
    Math.min(limit, 25),
  );
}
