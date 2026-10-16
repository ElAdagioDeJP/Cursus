import {
  Briefcase,
  CircleDot,
  Eye,
  House,
  Inbox,
  RefreshCw,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMembership } from "@/auth/guards";
import { listProjects } from "@/features/projects/queries";
import { getTeam } from "@/features/teams/queries";
import { listMembers } from "@/features/workspaces/queries";
import { cn } from "@/lib/cn";
import {
  teamBoard,
  teamCycles,
  teamHome,
  teamIssues,
  teamList,
  teamProjects,
  teamSettings,
  teamTriage,
  teamViews,
  wsMembers,
} from "@/lib/routes";
import { Avatar } from "@/ui/Avatar";

const ICON = { strokeWidth: 1.5, size: 16 } as const;

export default async function TeamHomePage({
  params,
}: {
  params: Promise<{ wsSlug: string; teamId: string }>;
}) {
  const { wsSlug, teamId } = await params;
  const m = await requireMembership(wsSlug);
  const team = await getTeam(m.workspaceId, teamId);
  if (!team) notFound();
  const [members, projects] = await Promise.all([
    listMembers(m.workspaceId),
    listProjects(m.workspaceId),
  ]);

  const tabs = [
    { href: teamHome(wsSlug, teamId), label: "Overview", active: true },
    { href: teamProjects(wsSlug, teamId), label: "Documents", active: false },
    { href: teamCycles(wsSlug, teamId), label: "Loops", active: false },
    { href: wsMembers(wsSlug), label: "Members", active: false },
  ];

  const goTo = [
    {
      href: teamTriage(wsSlug, teamId),
      label: "Triage",
      hint: "Bandeja de entrada del equipo",
      icon: <Inbox {...ICON} />,
    },
    {
      href: teamIssues(wsSlug, teamId),
      label: "Issues",
      hint: "Todas las incidencias",
      icon: <CircleDot {...ICON} />,
    },
    {
      href: teamCycles(wsSlug, teamId),
      label: "Cycles",
      hint: "Iteraciones y ritmo",
      icon: <RefreshCw {...ICON} />,
    },
    {
      href: teamProjects(wsSlug, teamId),
      label: "Projects",
      hint: `${projects.length} proyecto(s)`,
      icon: <Briefcase {...ICON} />,
    },
    {
      href: teamViews(wsSlug, teamId),
      label: "Views",
      hint: "Vistas guardadas",
      icon: <Eye {...ICON} />,
    },
    {
      href: teamSettings(wsSlug, teamId),
      label: "Settings",
      hint: "Ajustes del equipo",
      icon: <Settings {...ICON} />,
    },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div className="flex min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cursus-border bg-cursus-surface font-mono text-sm font-semibold text-cursus-text-1"
            >
              {team.key.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-wide text-cursus-text-3">
                {team.key}
              </p>
              <h1 className="truncate font-display text-xl font-semibold text-cursus-text-1">
                {team.name}
              </h1>
            </div>
          </div>
          <nav
            aria-label="Secciones del equipo"
            className="flex gap-1 border-b border-cursus-border"
          >
            {tabs.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                aria-current={t.active ? "page" : undefined}
                className={cn(
                  "-mb-px border-b-2 border-transparent px-3 py-2 text-[13px] text-cursus-text-3 hover:text-cursus-text-1",
                  t.active &&
                    "border-cursus-text-1 font-medium text-cursus-text-1",
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </header>

        <section aria-labelledby="team-resources">
          <h2
            id="team-resources"
            className="font-mono text-[11px] uppercase tracking-wide text-cursus-text-3"
          >
            Team resources
          </h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            <li className="rounded-lg border border-cursus-border bg-cursus-surface p-3">
              <Link
                href={teamBoard(wsSlug, teamId)}
                className="flex items-center gap-2 text-sm font-medium text-cursus-text-1 hover:underline"
              >
                <House {...ICON} aria-hidden="true" /> Tablero
              </Link>
              <p className="mt-1 text-[13px] text-cursus-text-3">
                Vista kanban de las incidencias activas.
              </p>
            </li>
            <li className="rounded-lg border border-cursus-border bg-cursus-surface p-3">
              <Link
                href={teamList(wsSlug, teamId)}
                className="flex items-center gap-2 text-sm font-medium text-cursus-text-1 hover:underline"
              >
                <CircleDot {...ICON} aria-hidden="true" /> Lista
              </Link>
              <p className="mt-1 text-[13px] text-cursus-text-3">
                Todas las incidencias en formato tabla.
              </p>
            </li>
            <li className="rounded-lg border border-cursus-border bg-cursus-surface p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-cursus-text-1">
                <Briefcase {...ICON} aria-hidden="true" /> Proyectos ·{" "}
                {projects.length}
              </p>
              <p className="mt-1 text-[13px] text-cursus-text-3">
                {projects.length === 0
                  ? "Aún no hay proyectos en el workspace."
                  : projects
                      .slice(0, 3)
                      .map((p) => `${p.key} ${p.name}`)
                      .join(" · ")}
              </p>
              <Link
                href={teamProjects(wsSlug, teamId)}
                className="mt-1 inline-block text-[13px] text-cursus-text-2 hover:text-cursus-text-1 hover:underline"
              >
                Ver proyectos
              </Link>
            </li>
          </ul>
        </section>
      </div>

      <aside className="flex flex-col gap-6" aria-label="Panel del equipo">
        <section aria-labelledby="team-members">
          <h2
            id="team-members"
            className="font-mono text-[11px] uppercase tracking-wide text-cursus-text-3"
          >
            Members · {members.length}
          </h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {members.slice(0, 6).map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-2 text-[13px] text-cursus-text-2"
              >
                <Avatar name={u.name ?? u.email} />
                <span className="truncate">{u.name ?? u.email}</span>
              </li>
            ))}
          </ul>
          <Link
            href={wsMembers(wsSlug)}
            className="mt-2 inline-block text-[13px] text-cursus-text-2 hover:text-cursus-text-1 hover:underline"
          >
            Ver todos
          </Link>
        </section>

        <section aria-labelledby="team-goto">
          <h2
            id="team-goto"
            className="font-mono text-[11px] uppercase tracking-wide text-cursus-text-3"
          >
            Go to
          </h2>
          <nav className="mt-2 flex flex-col gap-0.5" aria-label="Ir a">
            {goTo.map((g) => (
              <Link
                key={g.label}
                href={g.href}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-cursus-text-2 hover:bg-cursus-surface-2 hover:text-cursus-text-1"
              >
                <span aria-hidden="true" className="shrink-0">
                  {g.icon}
                </span>
                <span className="font-medium">{g.label}</span>
                <span className="truncate text-xs text-cursus-text-3">
                  {g.hint}
                </span>
              </Link>
            ))}
          </nav>
        </section>
      </aside>
    </div>
  );
}
