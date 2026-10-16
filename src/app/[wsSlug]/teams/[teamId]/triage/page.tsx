import { notFound } from "next/navigation";
import { requireMembership } from "@/auth/guards";
import { listIssues } from "@/features/issues/queries";
import { IssueList } from "@/features/notifications/_components/IssueList";
import { getTeam } from "@/features/teams/queries";

export const instant = false;

export default async function TeamTriagePage({
  params,
}: {
  params: Promise<{ wsSlug: string; teamId: string }>;
}) {
  const { wsSlug, teamId } = await params;
  const m = await requireMembership(wsSlug);
  const team = await getTeam(m.workspaceId, teamId);
  if (!team) notFound();

  const ctx = { userId: m.userId, workspaceId: m.workspaceId };
  const { issues } = await listIssues(ctx, teamId, {
    status: ["backlog"],
    limit: 50,
  });
  // Sin asignar primero; el resto mantiene el orden por sort_key.
  const sorted = [...issues].sort(
    (a, b) => Number(a.assignee_id !== null) - Number(b.assignee_id !== null),
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-cursus-text-1">
          <span className="font-mono text-cursus-text-2">{team.key}</span>{" "}
          Triage{" "}
          <span className="font-mono text-sm font-medium text-cursus-text-2">
            {sorted.length}
          </span>
        </h1>
        <p className="mt-1 text-sm text-cursus-text-3">
          Backlog del equipo, sin asignar primero.
        </p>
      </div>
      <IssueList
        wsSlug={wsSlug}
        issues={sorted}
        emptyTitle="Triage vacío"
        emptyHint="No hay incidencias en backlog para este equipo."
      />
    </div>
  );
}
