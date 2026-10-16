import { requireMembership } from "@/auth/guards";
import { listProjectIssues, listProjects } from "@/features/projects/queries";
import { EmptyState } from "@/ui/EmptyState";

export const instant = false;

export default async function WorkspaceProjectsPage({
  params,
}: {
  params: Promise<{ wsSlug: string }>;
}) {
  const { wsSlug } = await params;
  const m = await requireMembership(wsSlug);
  const projects = await listProjects(m.workspaceId);
  const counts = await Promise.all(
    projects.map(async (p) => ({
      id: p.id,
      count: (await listProjectIssues(m.workspaceId, p.id, 50)).length,
    })),
  );
  const countById = new Map(counts.map((c) => [c.id, c.count]));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-cursus-text-1">
          Proyectos{" "}
          <span className="font-mono text-sm font-medium text-cursus-text-2">
            {projects.length}
          </span>
        </h1>
        <p className="mt-1 text-sm text-cursus-text-3">
          Todos los proyectos del workspace.
        </p>
      </div>
      {projects.length === 0 ? (
        <EmptyState
          title="Sin proyectos"
          hint="Crea el primer proyecto desde la página de proyectos de un equipo."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-1 rounded-lg border border-cursus-border bg-cursus-surface p-4"
            >
              <p className="font-mono text-xs uppercase tracking-wide text-cursus-text-3">
                {p.key} · {countById.get(p.id) ?? 0} incidencias
              </p>
              <p className="font-display font-medium text-cursus-text-1">
                {p.name}
              </p>
              {p.description ? (
                <p className="line-clamp-2 text-sm text-cursus-text-3">
                  {p.description}
                </p>
              ) : null}
              <p className="mt-1 font-mono text-xs text-cursus-text-3">
                {p.team_keys.length > 0
                  ? `Equipos: ${p.team_keys.join(", ")}`
                  : "Sin equipos vinculados"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
