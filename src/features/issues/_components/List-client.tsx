/** Lista ventana (overscan) para cientos de issues sin librería pesada. */
"use client";

import { useEffect, useRef, useState } from "react";
import type { IssueListRow } from "@/db/types";
import { STATUS_LABEL } from "@/ui/Badge";
import { EmptyState } from "@/ui/EmptyState";
import { IssueCard } from "./IssueCard";

const ROW_H = 132;
const OVERSCAN = 8;

export function ListClient({
  wsSlug,
  teamId,
  issues,
}: {
  wsSlug: string;
  teamId: string;
  issues: IssueListRow[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState({ start: 0, end: 40 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const start = Math.max(0, Math.floor(el.scrollTop / ROW_H) - OVERSCAN);
      const end = Math.min(
        issues.length,
        Math.ceil((el.scrollTop + el.clientHeight) / ROW_H) + OVERSCAN,
      );
      setRange((prev) =>
        prev.start === start && prev.end === end ? prev : { start, end },
      );
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [issues.length]);

  if (issues.length === 0) {
    return (
      <EmptyState
        title="Sin incidencias"
        hint="Ajusta los filtros o crea la primera incidencia del equipo."
      />
    );
  }

  const visible = issues.slice(range.start, range.end);

  return (
    <div ref={ref} className="max-h-[70vh] overflow-y-auto">
      <div style={{ height: range.start * ROW_H }} aria-hidden="true" />
      <ul aria-label="Lista de incidencias">
        {visible.map((issue) => (
          <li
            key={issue.id}
            style={{ minHeight: ROW_H }}
            className="cursus-row border-b border-cursus-border py-2"
          >
            <div className="mb-1 font-mono text-[11px] uppercase tracking-wide text-cursus-text-3">
              {STATUS_LABEL[issue.status]}
            </div>
            <IssueCard issue={issue} wsSlug={wsSlug} teamId={teamId} />
          </li>
        ))}
      </ul>
      <div
        style={{ height: (issues.length - range.end) * ROW_H }}
        aria-hidden="true"
      />
    </div>
  );
}
