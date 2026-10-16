/**
 * Cycles mock en memoria (sin DB).
 * Cadencia: semanas de lunes a domingo; actual + 2 próximos.
 * Cuando exista la tabla `cycles`, sustituir `buildMockCycles` por query real
 * filtrando por `workspaceId` + `teamId` (ver TODO en queries).
 */
import type { Cycle, CycleGroupableIssue, CycleStatus } from "./types";

const DAY_MS = 86_400_000;

function startOfWeekMonday(d: Date): Date {
  const copy = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const dow = (copy.getUTCDay() + 6) % 7;
  copy.setUTCDate(copy.getUTCDate() - dow);
  return copy;
}

export function buildMockCycles(teamId: string, now = new Date()): Cycle[] {
  const start = startOfWeekMonday(now);
  const defs: Array<{ name: string; offset: number; status: CycleStatus }> = [
    { name: "Ciclo actual", offset: 0, status: "current" },
    { name: "Próximo ciclo", offset: 1, status: "upcoming" },
    { name: "Ciclo siguiente", offset: 2, status: "upcoming" },
  ];
  return defs.map((d, i) => {
    const s = new Date(start.getTime() + d.offset * 7 * DAY_MS);
    const e = new Date(s.getTime() + 6 * DAY_MS);
    return {
      id: `mock-${teamId}-c${i}`,
      teamId,
      name: d.name,
      startsAt: s.toISOString(),
      endsAt: e.toISOString(),
      status: d.status,
    };
  });
}

export function currentCycle(cycles: Cycle[]): Cycle | null {
  return cycles.find((c) => c.status === "current") ?? null;
}

export function upcomingCycles(cycles: Cycle[]): Cycle[] {
  return cycles.filter((c) => c.status === "upcoming");
}

const rangeFmt = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "12 – 18 ene". */
export function formatCycleRange(
  c: Pick<Cycle, "startsAt" | "endsAt">,
): string {
  return `${rangeFmt.format(new Date(c.startsAt))} – ${rangeFmt.format(new Date(c.endsAt))}`;
}

/**
 * Agrupa issues por ciclo.
 * 1. Si el issue trae `cycle_id` (futuro tras migrar), manda.
 * 2. Si no, placeholder por `due_date`: cae en el ciclo cuyo rango la contenga.
 * 3. Si no, queda en `uncycled`.
 */
export function groupIssuesByCycle<T extends CycleGroupableIssue>(
  issues: T[],
  cycles: Cycle[],
): { byCycle: Map<string, T[]>; uncycled: T[] } {
  const byCycle = new Map<string, T[]>(cycles.map((c) => [c.id, []]));
  const uncycled: T[] = [];
  for (const issue of issues) {
    if (issue.cycle_id && byCycle.has(issue.cycle_id)) {
      const bucket = byCycle.get(issue.cycle_id);
      if (bucket) bucket.push(issue);
      continue;
    }
    const due = issue.due_date ? Date.parse(issue.due_date) : Number.NaN;
    if (!Number.isNaN(due)) {
      const hit = cycles.find(
        (c) => due >= Date.parse(c.startsAt) && due <= Date.parse(c.endsAt),
      );
      if (hit) {
        const bucket = byCycle.get(hit.id);
        if (bucket) {
          bucket.push(issue);
          continue;
        }
      }
    }
    uncycled.push(issue);
  }
  return { byCycle, uncycled };
}
