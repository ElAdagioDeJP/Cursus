"use server";

import { updateTag } from "next/cache";
import { requireMembership } from "@/auth/guards";
import { canManage } from "@/auth/roles";
import { CreateTeamSchema } from "../workspaces/schema";
import { createTeam, listTeams } from "./queries";

export async function listTeamsAction(wsSlug: string) {
  const m = await requireMembership(wsSlug);
  return listTeams(m.workspaceId);
}

export async function createTeamAction(wsSlug: string, input: unknown) {
  const m = await requireMembership(wsSlug);
  if (!canManage(m.role)) throw new Error("Solo admin puede crear equipos.");
  const team = await createTeam(m.workspaceId, CreateTeamSchema.parse(input));
  updateTag(`teams:${m.workspaceId}`);
  return team;
}
