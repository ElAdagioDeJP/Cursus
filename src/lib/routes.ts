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
export const teamProject = (ws: string, team: string, project: string): Route =>
  `/${ws}/teams/${team}/projects/${project}` as Route;
export const issueDetail = (ws: string, team: string, issue: string): Route =>
  `/${ws}/teams/${team}/issues/${issue}` as Route;
