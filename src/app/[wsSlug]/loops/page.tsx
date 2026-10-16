import Link from "next/link";
import { requireMembership } from "@/auth/guards";
import {
  buildMockCycles,
  formatCycleRange,
  groupIssuesByCycle,
} from "@/features/cycles";
import { listIssues } from "@/features/issues/queries";
import { listTeams } from "@/features/teams/queries";
import { issueDetail } from "@/lib/routes";
import { StatusBadge } from "@/ui/Badge";
import { EmptyState } from "@/ui/EmptyState";

export const instant = false;

export default async function WorkspaceLoopsPage({
  params,
}: {
  params: Promise<{ wsSlug: string }>;
}) {
  const { wsSlug } = await params;
  const m = await requireMembership(wsSlug);
  const teams = await listTeams(m.workspaceId);

  const ctx = { userId: m.userId, workspaceId: m.workspaceId };
  const perTeam = await Promise.all(
    teams.map((t) => listIssues(ctx, t.id, { limit: 50 })),
  );
  const issues = perTeam.flatMap((r) => r.issues);

  const cycles = buildMockCycles(`ws-${wsSlug}`);
  const { byCycle, uncycled } = groupIssuesByCycle(issues, cycles);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-cursus-text-1">
          Loops
        </h1>
        <p className="mt-1 text-xs text-cursus-text-3">
          Estructura base en memoria (sin migración DB): `cycle_id` aún no
          existe en issues; el agrupado usa `due_date` como placeholder.
        </p>
      </div>

      {cycles.length === 0 ? (
        <EmptyState title="Sin loops" hint="No hay loops en este workspace." />
      ) : null}

      {cycles.map((c) => {
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

      <p className="text-xs text-cursus-text-3">
        {uncycled.length} incidencias sin loop (sin `due_date` en rango).
      </p>
    </div>
  );
}
