/**
 * Vistas por defecto en memoria (sin DB). Post-MVP: tabla `views`
 * (workspace_id, team_id, name, filters jsonb).
 */
import type { SavedView } from "./types";

export function defaultViews(teamId: string): SavedView[] {
  return [
    {
      id: `v-${teamId}-all`,
      teamId,
      name: "Todas",
      filters: {},
      isDefault: true,
    },
    {
      id: `v-${teamId}-todo`,
      teamId,
      name: "Por hacer",
      filters: { status: ["todo"] },
    },
    {
      id: `v-${teamId}-progress`,
      teamId,
      name: "En curso",
      filters: { status: ["in_progress"] },
    },
    {
      id: `v-${teamId}-review`,
      teamId,
      name: "En revisión",
      filters: { status: ["review"] },
    },
    {
      id: `v-${teamId}-done`,
      teamId,
      name: "Hechas",
      filters: { status: ["done"] },
    },
  ];
}
