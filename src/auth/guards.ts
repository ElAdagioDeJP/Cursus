/**
 * Guards server-side (§5.3). Fuente de verdad de autorización.
 * El middleware solo hace redirect rápido por cookie; aquí se verifica en DB.
 */
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import type { Session } from "next-auth";
import { cache } from "react";
import { first, getSql } from "@/db/client";
import { auth } from "./config";
import type { Role } from "./roles";

export interface MembershipContext {
  userId: string;
  workspaceId: string;
  workspaceSlug: string;
  role: Role;
}

export type AuthedSession = Session & {
  user: NonNullable<Session["user"]> & { id: string };
};

export const requireSession: () => Promise<AuthedSession> = cache(async () => {
  // cacheComponents: declara acceso a datos de la petición (cookies de sesión).
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  return session as AuthedSession;
});

/** Verifica membership del workspace por slug o lanza notFound (no filtra existencia). */
export const requireMembership: (wsSlug: string) => Promise<MembershipContext> =
  cache(async (wsSlug: string) => {
    const session = await requireSession();
    const userId = session.user.id;
    const sql = getSql();
    const rows = await sql`select w.id as workspace_id, w.slug, m.role
      from workspaces w join memberships m on m.workspace_id = w.id
      where w.slug = ${wsSlug} and m.user_id = ${userId}`;
    const r = first(
      rows as unknown as Array<{
        workspace_id: string;
        slug: string;
        role: Role;
      }>,
    );
    if (!r) notFound();
    return {
      userId,
      workspaceId: String(r.workspace_id),
      workspaceSlug: r.slug,
      role: r.role,
    };
  });
