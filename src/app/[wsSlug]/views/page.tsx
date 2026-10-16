import Link from "next/link";
import { requireMembership } from "@/auth/guards";
import { listTeams } from "@/features/teams/queries";
import { teamViews } from "@/lib/routes";
import { EmptyState } from "@/ui/EmptyState";

export const instant = false;

export default async function WorkspaceViewsPage({
  params,
}: {
  params: Promise<{ wsSlug: string }>;
}) {
  const { wsSlug } = await params;
  const m = await requireMembership(wsSlug);
  const teams = await listTeams(m.workspaceId);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-cursus-text-1">
          Views
        </h1>
        <p className="mt-1 text-sm text-cursus-text-3">
          Vistas guardadas por equipo del workspace.
        </p>
      </div>
      {teams.length === 0 ? (
        <EmptyState
          title="Sin equipos"
          hint="Crea tu primer equipo para ver sus vistas guardadas."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {teams.map((t) => (
            <li
              key={t.id}
              className="flex flex-col gap-1 rounded-lg border border-cursus-border bg-cursus-surface p-4"
            >
              <p className="font-mono text-xs uppercase tracking-wide text-cursus-text-3">
                {t.key}
              </p>
              <Link
                href={teamViews(wsSlug, t.id)}
                className="font-display font-medium text-cursus-text-1 hover:underline"
              >
                {t.name}
              </Link>
              <p className="text-sm text-cursus-text-3">
                {t.open_count} incidencias abiertas
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
