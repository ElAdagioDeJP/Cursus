/**
 * actions.ts — conectar/desconectar la GitHub App (solo admin del workspace).
 * El webhook ya auto-registra repos; estas acciones ligan la instalación
 * de GitHub con el workspace de Cursus.
 */
"use server";

import { requireMembership } from "@/auth/guards";
import { canManage } from "@/auth/roles";
import { connectInstallation, disconnectInstallation } from "./queries";
import { ConnectInstallationSchema } from "./schema";

async function adminCtx(wsSlug: string) {
  const m = await requireMembership(wsSlug);
  if (!canManage(m.role))
    throw new Error("Solo admin puede gestionar la integración GitHub.");
  return { userId: m.userId, workspaceId: m.workspaceId };
}

export async function connectGithubAction(wsSlug: string, input: unknown) {
  const ctx = await adminCtx(wsSlug);
  const parsed = ConnectInstallationSchema.parse({
    ...(input as Record<string, unknown>),
    workspaceId: ctx.workspaceId,
  });
  return connectInstallation(
    ctx.workspaceId,
    parsed.installationId,
    parsed.accountLogin,
    parsed.accountType,
    ctx.userId,
  );
}

export async function disconnectGithubAction(
  wsSlug: string,
  installationId: number,
) {
  const ctx = await adminCtx(wsSlug);
  if (!Number.isInteger(installationId) || installationId <= 0)
    throw new Error("installationId inválido.");
  await disconnectInstallation(ctx.workspaceId, installationId);
  return { ok: true };
}
