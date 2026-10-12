import { cn } from "@/lib/cn";

/* Punto de columna en token flow-* + texto en text-2 (AA garantizado).
   Cero violeta: review usa Petróleo (flow-review). */

const DOT: Record<string, string> = {
  backlog: "bg-flow-backlog",
  todo: "bg-flow-todo",
  in_progress: "bg-flow-in-progress",
  review: "bg-flow-review",
  done: "bg-flow-done",
  canceled: "bg-flow-canceled",
};

export const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  todo: "Por hacer",
  in_progress: "En curso",
  review: "En revisión",
  done: "Hecho",
  canceled: "Cancelado",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-cursus-surface-2 px-2 py-0.5 font-mono text-xs font-medium text-cursus-text-2",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 rounded-full", DOT[status] ?? DOT.backlog)}
      />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

const PRIO_CLASS: Record<number, string> = {
  1: "text-prio-1",
  2: "text-prio-2",
  3: "text-prio-3",
  4: "text-prio-4",
};

export function PriorityMark({ priority }: { priority: number }) {
  const bars = [1, 2, 3, 4];
  if (priority === 0)
    return (
      <span className="font-mono text-xs text-cursus-text-3">
        Sin prioridad
      </span>
    );
  const level = 5 - priority;
  const color = PRIO_CLASS[priority] ?? "text-prio-0";
  return (
    <span
      role="img"
      aria-label={`Prioridad ${priority}`}
      className={cn("inline-flex items-end gap-px", color)}
    >
      {bars.map((b) => (
        <span
          key={b}
          aria-hidden="true"
          className={cn(
            "w-1 rounded-sm",
            b <= level ? "bg-current" : "bg-current opacity-25",
          )}
          style={{ height: 4 + b * 3 }}
        />
      ))}
    </span>
  );
}
