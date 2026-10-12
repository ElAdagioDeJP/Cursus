"use server";

import { updateTag } from "next/cache";
import { requireMembership } from "@/auth/guards";
import { canWrite } from "@/auth/roles";
import { CreateProjectSchema } from "../workspaces/schema";
import { createProject, listProjects } from "./queries";

export async function listProjectsAction(wsSlug: string) {
  const m = await requireMembership(wsSlug);
  return listProjects(m.workspaceId);
}

export async function createProjectAction(wsSlug: string, input: unknown) {
  const m = await requireMembership(wsSlug);
  if (!canWrite(m.role))
    throw new Error("Sin permiso de escritura en este workspace.");
  const project = await createProject(
    m.workspaceId,
    CreateProjectSchema.parse(input),
  );
  updateTag(`projects:${m.workspaceId}`);
  return { id: project.id, key: project.key };
}
