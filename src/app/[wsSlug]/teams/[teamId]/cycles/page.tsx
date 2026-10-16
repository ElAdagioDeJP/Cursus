import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/auth/guards";
import {
  buildMockCycles,
  currentCycle,
  formatCycleRange,
  groupIssuesByCycle,
  upcomingCycles,
} from "@/features/cycles";
import { listIssues } from "@/features/issues/queries";
import { getTeam } from "@/features/teams/queries";
import { issueDetail, teamBoard, teamCycles, teamList } from "@/lib/routes";
import { StatusBadge } from "@/ui/Badge";
import { EmptyState } from "@/ui/EmptyState";

export default async function TeamCyclesPage({
  params,
  searchParams,
}: {
  params: Promise<{ wsSlug: string; teamId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { wsSlug, teamId } = await params;
  const m = await requireMembership(wsSlug);
  const team = await getTeam(m.workspaceId, teamId);
  if (!team) notFound();

  const sp = await searchParams;
  const tabRaw = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab = tabRaw === "upcoming" ? "upcoming" : "current";

  const cycles = buildMockCycles(teamId);
  const current = currentCycle(cycles);
  const upcoming = upcomingCycles(cycles);

  const ctx = { userId: m.userId, workspaceId: m.workspaceId };
  const { issues } = await listIssues(ctx, teamId, { limit: 50 });
  const { byCycle, uncycled } = groupIssuesByCycle(issues, cycles);

  const visible = tab === "current" ? (current ? [current] : []) : upcoming;
  const tabHref = (t: "current" | "upcoming"): Route =>
    `${teamCycles(wsSlug, teamId)}?tab=${t}` as Route;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-xl font-semibold text-cursus-text-1">
          <span className="font-mono text-cursus-text-2">{team.key}</span>{" "}
          Ciclos
        </h1>
        <nav
          className="flex gap-1 rounded-md border border-cursus-border p-0.5 text-sm"
          aria-label="Vistas"
        >
          <Link
            href={teamBoard(wsSlug, teamId)}
            className="rounded-md px-2.5 py-1 text-cursus-text-3 hover:bg-cursus-surface-2 hover:text-cursus-text-1"
          >
            Tablero
          </Link>
          <Link
            href={teamList(wsSlug, teamId)}
            className="rounded-md px-2.5 py-1 text-cursus-text-3 hover:bg-cursus-surface-2 hover:text-cursus-text-1"
          >
            Lista
          </Link>
          <span
            aria-current="page"
            className="rounded-md bg-cursus-surface-2 px-2.5 py-1 font-medium text-cursus-text-1"
          >
            Ciclos
          </span>
        </nav>
      </header>

      <nav
        className="flex gap-1 rounded-md border border-cursus-border p-0.5 text-sm"
        aria-label="Ciclos actual/próximos"
      >
        <Link
          href={tabHref("current")}
          aria-current={tab === "current" ? "page" : undefined}
          className={
            tab === "current"
              ? "rounded-md bg-cursus-surface-2 px-2.5 py-1 font-medium text-cursus-text-1"
              : "rounded-md px-2.5 py-1 text-cursus-text-3 hover:bg-cursus-surface-2 hover:text-cursus-text-1"
          }
        >
          Actual
        </Link>
        <Link
          href={tabHref("upcoming")}
          aria-current={tab === "upcoming" ? "page" : undefined}
          className={
            tab === "upcoming"
              ? "rounded-md bg-cursus-surface-2 px-2.5 py-1 font-medium text-cursus-text-1"
              : "rounded-md px-2.5 py-1 text-cursus-text-3 hover:bg-cursus-surface-2 hover:text-cursus-text-1"
          }
        >
          Próximos
        </Link>
      </nav>

      <p className="text-xs text-cursus-text-3">
        Estructura base en memoria (sin migración DB): `cycle_id` aún no existe
        en issues; el agrupado usa `due_date` como placeholder.
      </p>

      {visible.length === 0 ? (
        <EmptyState title="Sin ciclos" hint="No hay ciclos en esta pestaña." />
      ) : null}

      {visible.map((c) => {
        const list = byCycle.get(c.id) ?? [];
        return (
          <section
            key={c.id}
            aria-label={`${c.name} (${formatCycleRange(c)})`}
            className="rounded-lg border border-cursus-border bg-cursus-surface p-4"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="font-display font-medium text-cursus-text-1">
                {c.name}
              </h2>
              <p className="font-mono text-xs text-cursus-text-3">
                {formatCycleRange(c)}
              </p>
              <p className="ml-auto text-xs text-cursus-text-3">
                {list.length} incidencias
              </p>
            </div>
            {list.length === 0 ? (
              <p className="mt-2 text-sm text-cursus-text-3">
                Sin incidencias con vencimiento en este rango.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {list.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center gap-3 rounded-md border border-cursus-border p-2.5 text-sm"
                  >
                    <span className="font-mono text-xs text-cursus-text-3">
                      {i.identifier}
                    </span>
                    <Link
                      href={issueDetail(wsSlug, i.team_id, i.id)}
                      className="font-medium text-cursus-text-1 hover:underline"
                    >
                      {i.title}
                    </Link>
                    <span className="ml-auto">
                      <StatusBadge status={i.status} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {tab === "current" ? (
        <p className="text-xs text-cursus-text-3">
          {uncycled.length} incidencias sin ciclo (sin `due_date` en rango).
        </p>
      ) : null}
    </div>
  );
}
