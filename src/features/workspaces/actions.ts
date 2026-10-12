"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMembership, requireSession } from "@/auth/guards";
import { canManage } from "@/auth/roles";
import {
  createWorkspace,
  listWorkspacesForUser,
  renameWorkspace,
} from "./queries";
import { CreateWorkspaceSchema } from "./schema";

export async function createWorkspaceAction(input: unknown) {
  const session = await requireSession();
  return createWorkspace(session.user.id, CreateWorkspaceSchema.parse(input));
}

export async function listWorkspacesAction() {
  const session = await requireSession();
  return listWorkspacesForUser(session.user.id);
}

export async function renameWorkspaceAction(wsSlug: string, name: unknown) {
  const m = await requireMembership(wsSlug);
  if (!canManage(m.role))
    throw new Error("Solo admin puede renombrar el workspace.");
  const parsed = z.string().trim().min(2).max(80).parse(name);
  const ws = await renameWorkspace(m.workspaceId, parsed);
  revalidatePath(`/${wsSlug}`);
  return ws;
}
