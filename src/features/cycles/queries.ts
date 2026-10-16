/**
 * queries.ts cycles — ESTRUCTURA LISTA PARA DB REAL, hoy mock en memoria.
 *
 * TODO(DB): crear migración `cycles` (NO hacer aún):
 *   cycles(id uuid pk, workspace_id fk, team_id fk, name text,
 *     starts_at timestamptz, ends_at timestamptz,
 *     unique(team_id, starts_at)) +
 *   issues.cycle_id uuid null fk → cycles(id) on delete set null.
 * Entonces: listCycles = select por workspace+team ordenado por starts_at;
 * listIssuesByCycle = issues where cycle_id = X (tenant por join teams).
 */
import type { IssueListRow } from "@/db/types";
import { buildMockCycles, groupIssuesByCycle } from "./mock";
import type { Cycle } from "./types";

export async function listCycles(
  teamId: string,
  now = new Date(),
): Promise<Cycle[]> {
  return buildMockCycles(teamId, now);
}

export async function listUncycledIssues(
  issues: IssueListRow[],
  cycles: Cycle[],
): Promise<IssueListRow[]> {
  return groupIssuesByCycle(issues, cycles).uncycled as IssueListRow[];
}

export type { Cycle };
export { buildMockCycles, groupIssuesByCycle };
