import { redirect } from "next/navigation";
import { requireMembership } from "@/auth/guards";
import { createTeamAction } from "@/features/teams/actions";
import { listTeams } from "@/features/teams/queries";
import { getWorkspaceBySlug } from "@/features/workspaces/queries";
import { teamBoard, wsHome } from "@/lib/routes";
import { Button } from "@/ui/Button";

export default async function WorkspaceHome({
  params,
}: {
  params: Promise<{ wsSlug: string }>;
}) {
  const { wsSlug } = await params;
  const m = await requireMembership(wsSlug);
  const ws = await getWorkspaceBySlug(wsSlug);
  const teams = await listTeams(m.workspaceId);
  if (teams.length > 0 && teams[0]) redirect(teamBoard(wsSlug, teams[0].id));

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-cursus-text-3">
          Primer paso
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-cursus-text-1">
          {ws?.name ?? wsSlug}
        </h1>
        <p className="mt-1 text-sm text-cursus-text-3">
          Crea tu primer equipo para empezar.
        </p>
      </div>
      <form
        action={async (fd: FormData) => {
          "use server";
          await createTeamAction(wsSlug, {
            name: String(fd.get("name")),
            key: String(fd.get("key")).toUpperCase(),
          });
          redirect(wsHome(wsSlug));
        }}
        className="flex flex-col gap-2 rounded-lg border border-cursus-border bg-cursus-surface p-4"
      >
        <label className="flex flex-col gap-1 text-sm text-cursus-text-2">
          Nombre del equipo
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="p. ej. Carril"
            className="rounded-md border border-cursus-border bg-cursus-surface px-3 py-2 text-cursus-text-1 placeholder:text-cursus-text-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-cursus-text-2">
          Clave (2–6 mayúsculas, ej CUR)
          <input
            name="key"
            required
            pattern="[A-Z]{2,6}"
            maxLength={6}
            placeholder="CUR"
            className="rounded-md border border-cursus-border bg-cursus-surface px-3 py-2 font-mono text-cursus-text-1 placeholder:text-cursus-text-3"
          />
        </label>
        <div>
          <Button type="submit">Crear equipo</Button>
        </div>
      </form>
    </div>
  );
}
