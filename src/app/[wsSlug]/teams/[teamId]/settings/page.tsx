import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/auth/guards";
import { getTeam } from "@/features/teams/queries";
import { wsMembers } from "@/lib/routes";

export const instant = false;

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ wsSlug: string; teamId: string }>;
}) {
  const { wsSlug, teamId } = await params;
  const m = await requireMembership(wsSlug);
  const team = await getTeam(m.workspaceId, teamId);
  if (!team) notFound();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="font-display text-xl font-semibold text-cursus-text-1">
        <span className="font-mono text-cursus-text-2">{team.key}</span>{" "}
        Ajustes
      </h1>
      <dl className="flex flex-col gap-3 rounded-lg border border-cursus-border bg-cursus-surface p-4 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-cursus-text-3">Nombre</dt>
          <dd className="font-medium text-cursus-text-1">{team.name}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-cursus-text-3">Clave</dt>
          <dd className="font-mono text-cursus-text-1">{team.key}</dd>
        </div>
      </dl>
      <p className="text-sm text-cursus-text-3">
        Renombrar aún no disponible (sin action de rename en teams/actions).
      </p>
      <Link
        href={wsMembers(wsSlug)}
        className="text-sm text-cursus-text-2 hover:text-cursus-text-1 hover:underline"
      >
        Ver miembros del workspace
      </Link>
    </div>
  );
}
