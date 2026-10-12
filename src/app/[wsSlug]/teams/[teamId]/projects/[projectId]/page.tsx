import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/auth/guards";
import { getProject, listProjectIssues } from "@/features/projects/queries";
import { getTeam } from "@/features/teams/queries";
import { issueDetail } from "@/lib/routes";
import { StatusBadge } from "@/ui/Badge";

export default async function TeamProjectDetailPage({
  params,
}: {
  params: Promise<{ wsSlug: string; teamId: string; projectId: string }>;
}) {
  const { wsSlug, teamId, projectId } = await params;
  const m = await requireMembership(wsSlug);
  const team = await getTeam(m.workspaceId, teamId);
  if (!team) notFound();
  const found = await getProject(m.workspaceId, projectId);
  if (!found) notFound();
  const issues = await listProjectIssues(m.workspaceId, projectId);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold">
        <span className="font-mono opacity-50">{found.project.key}</span>{" "}
        {found.project.name}
      </h1>
      {found.project.description ? (
        <p className="text-sm opacity-70">{found.project.description}</p>
      ) : null}
      <p className="text-xs opacity-50">
        Equipos: {found.teams.map((t) => t.key).join(", ") || "—"} ·{" "}
        {issues.length} incidencias
      </p>
      <ul className="flex flex-col gap-2">
        {issues.map((i) => (
          <li
            key={i.id}
            className="flex items-center gap-3 rounded-lg border p-3 text-sm"
          >
            <span className="font-mono text-xs opacity-50">{i.identifier}</span>
            <Link
              href={issueDetail(wsSlug, i.team_id, i.id)}
              className="font-medium hover:underline"
            >
              {i.title}
            </Link>
            <span className="ml-auto">
              <StatusBadge status={i.status} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
