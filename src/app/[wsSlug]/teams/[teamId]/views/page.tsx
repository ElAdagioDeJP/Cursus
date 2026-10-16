import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/auth/guards";
import { getTeam } from "@/features/teams/queries";
import { defaultViews } from "@/features/views";
import { teamList } from "@/lib/routes";

export const instant = false;

function describeFilters(filters: { status?: string[] }): string {
  if (!filters.status || filters.status.length === 0) return "Todas las incidencias";
  return `Estado: ${filters.status.join(", ")}`;
}

export default async function TeamViewsPage({
  params,
}: {
  params: Promise<{ wsSlug: string; teamId: string }>;
}) {
  const { wsSlug, teamId } = await params;
  const m = await requireMembership(wsSlug);
  const team = await getTeam(m.workspaceId, teamId);
  if (!team) notFound();
  const views = defaultViews(teamId);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-cursus-text-1">
          <span className="font-mono text-cursus-text-2">{team.key}</span>{" "}
          Views
        </h1>
        <p className="mt-1 text-sm text-cursus-text-3">
          Vistas guardadas del equipo (en memoria; persistencia post-MVP).
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {views.map((v) => {
          const href =
            v.filters.status && v.filters.status.length > 0
              ? (`${teamList(wsSlug, teamId)}?status=${v.filters.status.join(",")}` as Route)
              : teamList(wsSlug, teamId);
          return (
            <li
              key={v.id}
              className="flex flex-col gap-1 rounded-lg border border-cursus-border bg-cursus-surface p-4"
            >
              <Link
                href={href}
                className="font-display font-medium text-cursus-text-1 hover:underline"
              >
                {v.name}
              </Link>
              <p className="text-sm text-cursus-text-3">
                {describeFilters(v.filters)}
              </p>
              {v.isDefault ? (
                <p className="font-mono text-xs uppercase tracking-wide text-cursus-text-3">
                  Por defecto
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
