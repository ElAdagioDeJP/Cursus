/**
 * Cycles (paridad Linear): tipos base.
 * Sin tabla en DB todavía: `cycle_id` en issues NO existe.
 * Cuando se migre, `IssueRow.cycle_id: string | null` + tabla `cycles`.
 */

export type CycleStatus = "current" | "upcoming" | "completed";

export interface Cycle {
  id: string;
  /** Equipo dueño del ciclo (Linear: cycles son por team). */
  teamId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: CycleStatus;
}

/** Fila de issue con el campo futuro `cycle_id` (opcional hasta migrar DB). */
export type IssueWithCycleId<T> = T & { cycle_id?: string | null };

/** Fila mínima necesaria para agrupar por ciclo (placeholder por dueDate). */
export interface CycleGroupableIssue {
  id: string;
  cycle_id?: string | null;
  due_date?: string | null;
}
