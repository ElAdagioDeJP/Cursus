/** Tablero Kanban: DnD con teclado + optimista. La verdad vive en el servidor (refresh). */
"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import type { IssueListRow } from "@/db/types";
import { useUiStore } from "@/lib/ui-store";
import { STATUS_LABEL } from "@/ui/Badge";
import { EmptyState } from "@/ui/EmptyState";
import { moveIssueAction } from "../actions";
import { keyBetween } from "../lib/ordering";
import { IssueCard } from "./IssueCard";

const STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
  "canceled",
] as const;
type Status = (typeof STATUSES)[number];

interface Move {
  id: string;
  status: Status;
  sortKey: string;
}

function applyMove(state: IssueListRow[], move: Move): IssueListRow[] {
  return state.map((i) =>
    i.id === move.id
      ? { ...i, status: move.status, sort_key: move.sortKey }
      : i,
  );
}

function SortableCard({
  issue,
  wsSlug,
  teamId,
  dragging,
}: {
  issue: IssueListRow;
  wsSlug: string;
  teamId: string;
  dragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: issue.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <IssueCard
        issue={issue}
        wsSlug={wsSlug}
        teamId={teamId}
        dragging={dragging}
        dragProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function BoardClient({
  wsSlug,
  teamId,
  initialIssues,
}: {
  wsSlug: string;
  teamId: string;
  initialIssues: IssueListRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticIssues, applyOptimisticMove] = useOptimistic(
    initialIssues,
    applyMove,
  );
  const [announcement, setAnnouncement] = useState("");
  const setDndActiveId = useUiStore((s) => s.setDndActiveId);
  const dndActiveId = useUiStore((s) => s.dndActiveId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columnOf = (
    issues: IssueListRow[],
    overId: string | null,
  ): Status | null => {
    if (!overId) return null;
    if (overId.startsWith("column:")) return overId.slice(7) as Status;
    return issues.find((i) => i.id === overId)?.status ?? null;
  };

  const onDragStart = (e: DragStartEvent) =>
    setDndActiveId(String(e.active.id));

  const onDragOver = (e: DragOverEvent) => {
    const activeId = String(e.active.id);
    const target = columnOf(
      optimisticIssues,
      e.over ? String(e.over.id) : null,
    );
    const current = optimisticIssues.find((i) => i.id === activeId);
    if (target && current && current.status !== target) {
      startTransition(() => {
        applyOptimisticMove({
          id: activeId,
          status: target,
          sortKey: current.sort_key,
        });
      });
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDndActiveId(null);
    const activeId = String(e.active.id);
    const current = optimisticIssues.find((i) => i.id === activeId);
    if (!current || !e.over) return;
    const target = columnOf(optimisticIssues, String(e.over.id));
    if (!target) return;

    const column = optimisticIssues
      .filter((i) => i.status === target && i.id !== activeId)
      .sort((a, b) => (a.sort_key < b.sort_key ? -1 : 1));
    const overId = String(e.over.id);
    const overIdx = overId.startsWith("column:")
      ? column.length
      : column.findIndex((i) => i.id === overId);
    const idx = overIdx < 0 ? column.length : overIdx;
    const prev = column[idx - 1]?.sort_key ?? null;
    const next = column[idx]?.sort_key ?? null;
    let newKey: string;
    try {
      newKey = keyBetween(prev, next);
    } catch {
      router.refresh();
      return;
    }
    if (current.status === target && current.sort_key === newKey) return;

    startTransition(() => {
      applyOptimisticMove({ id: activeId, status: target, sortKey: newKey });
      setAnnouncement(`Incidencia movida a ${STATUS_LABEL[target]}.`);
    });
    startTransition(async () => {
      try {
        await moveIssueAction(wsSlug, {
          id: activeId,
          toStatus: target,
          toSortKey: newKey,
        });
        router.refresh();
      } catch {
        router.refresh();
      }
    });
  };

  if (optimisticIssues.length === 0) {
    return (
      <EmptyState
        title="Sin incidencias"
        hint="Crea la primera incidencia del equipo con el botón Nueva incidencia."
      />
    );
  }

  return (
    <>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDndActiveId(null)}
      >
        <section
          className="flex snap-x gap-3 overflow-x-auto pb-4"
          aria-label="Tablero por estado"
        >
          {STATUSES.map((status) => {
            const items = optimisticIssues
              .filter((i) => i.status === status)
              .sort((a, b) => (a.sort_key < b.sort_key ? -1 : 1));
            return (
              <Column
                key={status}
                status={status}
                wsSlug={wsSlug}
                teamId={teamId}
                items={items}
                activeId={dndActiveId}
              />
            );
          })}
        </section>
      </DndContext>
    </>
  );
}

function Column({
  status,
  wsSlug,
  teamId,
  items,
  activeId,
}: {
  status: Status;
  wsSlug: string;
  teamId: string;
  items: IssueListRow[];
  activeId: string | null;
}) {
  return (
    <section
      aria-label={`${STATUS_LABEL[status]} (${items.length})`}
      className="w-72 shrink-0 snap-start rounded-lg border border-cursus-border bg-transparent p-2"
    >
      <header className="flex items-center justify-between px-1.5 py-1.5">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-cursus-text-2">
          {STATUS_LABEL[status]}
        </h2>
        <span className="sr-only">{items.length} incidencias</span>
        <span
          aria-hidden="true"
          className="rounded-full bg-cursus-surface-2 px-2 font-mono text-xs text-cursus-text-2"
        >
          {items.length}
        </span>
      </header>
      <DroppableColumn status={status}>
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex min-h-24 flex-col gap-2">
            {items.map((issue) => (
              <li key={issue.id} className="cursus-row">
                <SortableCard
                  issue={issue}
                  wsSlug={wsSlug}
                  teamId={teamId}
                  dragging={activeId === issue.id}
                />
              </li>
            ))}
          </ul>
          {items.length === 0 ? (
            <p className="px-1.5 py-3 text-center text-xs text-cursus-text-3">
              Sin incidencias
            </p>
          ) : null}
        </SortableContext>
      </DroppableColumn>
    </section>
  );
}

function DroppableColumn({
  status,
  children,
}: {
  status: Status;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${status}` });
  return (
    <div
      ref={setNodeRef}
      className={
        isOver
          ? "rounded-lg outline-2 outline-dashed outline-cursus-primary outline-offset-2"
          : "rounded-lg outline-2 outline-transparent"
      }
    >
      {children}
    </div>
  );
}
