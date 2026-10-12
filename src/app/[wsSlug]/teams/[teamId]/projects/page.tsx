import { notFound } from "next/navigation";
import { requireMembership } from "@/auth/guards";
import { createProjectAction } from "@/features/projects/actions";
import { listProjects } from "@/features/projects/queries";
import { getTeam } from "@/features/teams/queries";
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

  const inputCls =
    "rounded-md border border-cursus-border bg-cursus-surface px-3 py-2 text-sm text-cursus-text-1 placeholder:text-cursus-text-3";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-cursus-text-1">
        Proyectos
      </h1>
      {projects.length === 0 ? (
        <EmptyState
          title="Sin proyectos"
          hint="Crea el primer proyecto para agrupar incidencias de varios equipos."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-cursus-border bg-cursus-surface p-3"
            >
              <p className="font-medium text-cursus-text-1">
                <span className="font-mono text-cursus-text-2">{p.key}</span>{" "}
                {p.name}
              </p>
              {p.description ? (
                <p className="mt-0.5 text-sm text-cursus-text-3">
                  {p.description}
                </p>
              ) : null}
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
