/** Lista agrupada por estado (Linear): grupo + conteo, row densa con
 *  identifier, título, pills de etiquetas, fecha y avatar. Inserción
 *  optimista de la incidencia recién creada (evento del modal). */
"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useTransition } from "react";
import type { IssueListRow } from "@/db/types";
import { issueDetail } from "@/lib/routes";
import { Avatar } from "@/ui/Avatar";
import { STATUS_LABEL } from "@/ui/Badge";
import { EmptyState } from "@/ui/EmptyState";
import { GROUP_ORDER, type IssueGroup } from "./filters";

const PROVISIONAL_EVENT = "cursus:provisional-issue";

/** El modal emite la fila recién creada; la lista la muestra sin esperar al refresh. */
export function emitProvisionalIssue(row: IssueListRow) {
  window.dispatchEvent(
    new CustomEvent<IssueListRow>(PROVISIONAL_EVENT, { detail: row }),
  );
}

function insertProvisional(
  groups: IssueGroup[],
  row: IssueListRow,
): IssueGroup[] {
  if (groups.some((g) => g.status === row.status)) {
    return groups.map((g) =>
      g.status !== row.status ||
      g.issues.some((i) => i.identifier === row.identifier)
        ? g
        : { ...g, issues: [row, ...g.issues] },
    );
  }
  const created: IssueGroup = { status: row.status, issues: [row] };
  const order = GROUP_ORDER.indexOf(row.status);
  const at = groups.findIndex((g) => GROUP_ORDER.indexOf(g.status) > order);
  if (at < 0) return [...groups, created];
  return [...groups.slice(0, at), created, ...groups.slice(at)];
}

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function IssueRow({
  issue,
  wsSlug,
  teamId,
}: {
  issue: IssueListRow;
  wsSlug: string;
  teamId: string;
}) {
  const date = issue.due_date ?? issue.updated_at;
  return (
    <li className="cursus-row flex items-center gap-2 border-b border-cursus-border px-2.5 py-2 last:border-b-0 hover:bg-cursus-surface-2">
      <span className="w-20 shrink-0 font-mono text-xs text-cursus-text-2">
        {issue.identifier}
      </span>
      <Link
        href={issueDetail(wsSlug, teamId, issue.id)}
        className="min-w-0 flex-1 truncate text-sm font-medium text-cursus-text-1 hover:underline"
      >
        {issue.title}
      </Link>
      <span className="hidden shrink-0 flex-wrap justify-end gap-1 sm:flex">
        {issue.label_names?.slice(0, 3).map((l) => (
          <span
            key={l}
            className="rounded-full bg-cursus-surface-2 px-1.5 py-px text-[11px] text-cursus-text-2"
          >
            {l}
          </span>
        ))}
      </span>
      <time
        dateTime={date ?? undefined}
        title={date ?? undefined}
        className="w-14 shrink-0 text-right font-mono text-[11px] text-cursus-text-3"
      >
        {shortDate(date)}
      </time>
      <Avatar name={issue.assignee_name} />
    </li>
  );
}

export function ListClient({
  wsSlug,
  teamId,
  groups,
}: {
  wsSlug: string;
  teamId: string;
  groups: IssueGroup[];
}) {
  const [, startTransition] = useTransition();
  const [optimisticGroups, insertRow] = useOptimistic(
    groups,
    insertProvisional,
  );

  useEffect(() => {
    const onProvisional = (e: Event) => {
      const row = (e as CustomEvent<IssueListRow>).detail;
      if (!row || row.team_id !== teamId) return;
      startTransition(() => insertRow(row));
    };
    window.addEventListener(PROVISIONAL_EVENT, onProvisional);
    return () => window.removeEventListener(PROVISIONAL_EVENT, onProvisional);
  }, [insertRow, teamId]);

  const total = optimisticGroups.reduce((n, g) => n + g.issues.length, 0);
  if (total === 0) {
    return (
      <EmptyState
        title="Sin incidencias"
        hint="Ajusta los filtros o crea la primera incidencia del equipo."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {optimisticGroups.map((group) => (
        <section
          key={group.status}
          aria-label={`${STATUS_LABEL[group.status]} (${group.issues.length})`}
        >
          <header className="flex items-center gap-2 px-1 py-1.5">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-cursus-text-2">
              {STATUS_LABEL[group.status]}
            </h2>
            <span
              aria-hidden="true"
              className="rounded-full bg-cursus-surface-2 px-2 font-mono text-xs text-cursus-text-2"
            >
              {group.issues.length}
            </span>
            <span className="sr-only">{group.issues.length} incidencias</span>
          </header>
          {group.issues.length === 0 ? (
            <p className="px-1 py-2 text-xs text-cursus-text-3">
              Sin incidencias
            </p>
          ) : (
            <ul className="overflow-hidden rounded-lg border border-cursus-border bg-cursus-surface">
              {group.issues.map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  wsSlug={wsSlug}
                  teamId={teamId}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
