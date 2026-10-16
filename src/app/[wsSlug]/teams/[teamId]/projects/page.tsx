import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/auth/guards";
import { createProjectAction } from "@/features/projects/actions";
import { listProjectIssues, listProjects } from "@/features/projects/queries";
import { getTeam } from "@/features/teams/queries";
import { teamProject } from "@/lib/routes";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";

export default async function TeamProjectsPage({
  params,
}: {
  params: Promise<{ wsSlug: string; teamId: string }>;
}) {
  const { wsSlug, teamId } = await params;
  const m = await requireMembership(wsSlug);
  const team = await getTeam(m.workspaceId, teamId);
  if (!team) notFound();
  const projects = await listProjects(m.workspaceId);
  const counts = await Promise.all(
    projects.map(async (p) => ({
      id: p.id,
      count: (await listProjectIssues(m.workspaceId, p.id, 50)).length,
    })),
  );
  const countById = new Map(counts.map((c) => [c.id, c.count]));

  const inputCls =
    "rounded-md border border-cursus-border bg-cursus-surface px-3 py-2 text-sm text-cursus-text-1 placeholder:text-cursus-text-3";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-cursus-text-1">
        <span className="font-mono text-cursus-text-2">{team.key}</span>{" "}
        Proyectos
      </h1>
      {projects.length === 0 ? (
        <EmptyState
          title="Sin proyectos"
          hint="Crea el primer proyecto para agrupar incidencias de varios equipos."
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
              <Link
                href={teamProject(wsSlug, teamId, p.id)}
                className="font-display font-medium text-cursus-text-1 hover:underline"
              >
                {p.name}
              </Link>
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
      <form
        action={async (fd: FormData) => {
          "use server";
          await createProjectAction(wsSlug, {
            name: String(fd.get("name")),
            key: String(fd.get("key")).toUpperCase(),
            description: String(fd.get("description") ?? ""),
            teamIds: [teamId],
          });
        }}
        className="flex flex-col gap-2 rounded-lg border border-cursus-border bg-cursus-surface p-4"
      >
        <h2 className="font-display font-medium text-cursus-text-1">
          Nuevo proyecto
        </h2>
        <label className="flex flex-col gap-1 text-[13px] text-cursus-text-2">
          Nombre
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="Nombre"
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-cursus-text-2">
          Clave (2–6 mayúsculas)
          <input
            name="key"
            required
            pattern="[A-Z]{2,6}"
            maxLength={6}
            placeholder="CLAVE"
            className={`${inputCls} font-mono`}
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-cursus-text-2">
          Descripción (opcional)
          <input
            name="description"
            maxLength={5000}
            placeholder="Descripción (opcional)"
            className={inputCls}
          />
        </label>
        <div>
          <Button type="submit">Crear proyecto</Button>
        </div>
      </form>
    </div>
  );
}
