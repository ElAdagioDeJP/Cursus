import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireMembership } from "@/auth/guards";
import { FiltersBar } from "@/features/issues/_components/FiltersBar-client";
import { loadIssueFilters } from "@/features/issues/_components/filters";
import { ListServer } from "@/features/issues/_components/List-server";
import { NewIssueForm } from "@/features/issues/_components/NewIssueForm-client";
import { listLabels } from "@/features/issues/queries";
import { listProjects } from "@/features/projects/queries";
import { getTeam } from "@/features/teams/queries";
import { teamBoard } from "@/lib/routes";
import { RealtimeRefresh } from "@/realtime/client";
import { ListSkeleton } from "@/ui/Skeleton";

export default async function ListPage({
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
  const filters = await loadIssueFilters(await searchParams);
  const ctx = { userId: m.userId, workspaceId: m.workspaceId };
  const [projects, labels] = await Promise.all([
    listProjects(m.workspaceId),
    listLabels(ctx),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-xl font-semibold text-cursus-text-1">
          <span className="font-mono text-cursus-text-2">{team.key}</span>{" "}
          {team.name}
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
          <span
            aria-current="page"
            className="rounded-md bg-cursus-surface-2 px-2.5 py-1 font-medium text-cursus-text-1"
          >
            Lista
          </span>
        </nav>
        <span className="ml-auto">
          <NewIssueForm
            wsSlug={wsSlug}
            teamId={teamId}
            projects={projects}
            labels={labels}
          />
        </span>
      </header>
      <FiltersBar projects={projects} />
      <RealtimeRefresh teamId={teamId} />
      <Suspense fallback={<ListSkeleton />}>
        <ListServer wsSlug={wsSlug} teamId={teamId} filters={filters} />
      </Suspense>
    </div>
  );
}
