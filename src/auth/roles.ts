/** Roles §1: Owner|Admin|Member|Guest. Jerarquía para guards y MCP scopes. */

export const ROLES = ["owner", "admin", "member", "guest"] as const;
export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = { owner: 4, admin: 3, member: 2, guest: 1 };

export function hasRank(role: Role, minimum: Role): boolean {
  return RANK[role] >= RANK[minimum];
}

/** Escribir issues/projects/teams/labels: member o superior. */
export function canWrite(role: Role): boolean {
  return hasRank(role, "member");
}

/** Gestionar workspace (miembros, claves MCP, ajustes): admin o superior. */
export function canManage(role: Role): boolean {
  return hasRank(role, "admin");
}
