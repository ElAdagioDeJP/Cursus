/**
 * Auth.js v5: solo OAuth GitHub + Google (§5). Sin passwords en MVP.
 * trustHost: detrás de Traefik (TLS termina en el proxy).
 */
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { getSql } from "@/db/client";
import { CustomPostgresAdapter } from "./adapter";
import type { Role } from "./roles";

declare module "next-auth" {
  interface Session {
    workspaceIds: string[];
    roleByWorkspace: Record<string, Role>;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: CustomPostgresAdapter(),
  trustHost: true,
  session: { strategy: "database" },
  pages: { signIn: "/sign-in" },
  providers: [
    GitHub({ allowDangerousEmailAccountLinking: false }),
    Google({ allowDangerousEmailAccountLinking: false }),
  ],
  callbacks: {
    async session({ session, user }) {
      const sql = getSql();
      const rows =
        await sql`select workspace_id, role from memberships where user_id = ${user.id}`;
      session.workspaceIds = rows.map((r) => String(r.workspace_id));
      session.roleByWorkspace = Object.fromEntries(
        rows.map((r) => [String(r.workspace_id), r.role as Role]),
      );
      return session;
    },
  },
});
