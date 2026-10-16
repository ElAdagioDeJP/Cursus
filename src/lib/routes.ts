/**
 * URLs con segmentos dinámicos. Next 16 RouteImpl no acepta strings
 * interpolados (ni siquiera `/${slug}`), así que se construyen aquí una vez
 * con `as Route` y el resto del código usa estos helpers (un solo seam auditable).
 */
import type { Route } from "next";

export const wsHome = (ws: string): Route => `/${ws}` as Route;
export const wsMembers = (ws: string): Route => `/${ws}/members` as Route;
export const wsSettings = (ws: string): Route => `/${ws}/settings` as Route;
export const teamBoard = (ws: string, team: string): Route =>
  `/${ws}/teams/${team}/board` as Route;
export const teamList = (ws: string, team: string): Route =>
  `/${ws}/teams/${team}/list` as Route;
export const teamProjects = (ws: string, team: string): Route =>
  `/${ws}/teams/${team}/projects` as Route;
export const teamCycles = (ws: string, team: string): Route =>
  `/${ws}/teams/${team}/cycles` as Route;
export const wsAgent = (ws: string): Route => `/${ws}/agent` as Route;
export const wsInbox = (ws: string): Route => `/${ws}/inbox` as Route;
export const wsReviews = (ws: string): Route => `/${ws}/reviews` as Route;
export const wsMyIssues = (ws: string): Route => `/${ws}/my-issues` as Route;
export const wsPulse = (ws: string): Route => `/${ws}/pulse` as Route;
export const teamProject = (ws: string, team: string, project: string): Route =>
  `/${ws}/teams/${team}/projects/${project}` as Route;
export const issueDetail = (ws: string, team: string, issue: string): Route =>
  `/${ws}/teams/${team}/issues/${issue}` as Route;
// --- Team home + navegación paridad Linear (solo añadidos) ---
export const teamHome = (ws: string, team: string): Route =>
  `/${ws}/teams/${team}` as Route;
export const teamTriage = (ws: string, team: string): Route =>
  `/${ws}/teams/${team}/triage` as Route;
export const teamIssues = (ws: string, team: string): Route =>
  `/${ws}/teams/${team}/issues` as Route;
export const teamViews = (ws: string, team: string): Route =>
  `/${ws}/teams/${team}/views` as Route;
export const teamSettings = (ws: string, team: string): Route =>
  `/${ws}/teams/${team}/settings` as Route;
// --- Secciones de workspace (paridad Linear) ---
export const wsInitiatives = (ws: string): Route =>
  `/${ws}/initiatives` as Route;
export const wsProjects = (ws: string): Route => `/${ws}/projects` as Route;
export const wsViews = (ws: string): Route => `/${ws}/views` as Route;
export const wsLoops = (ws: string): Route => `/${ws}/loops` as Route;
