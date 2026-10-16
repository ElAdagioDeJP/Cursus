/** Sidebar paridad Linear (cliente: activa + colapsable + equipos expandibles). */
"use client";

import {
  Briefcase,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Ellipsis,
  Eye,
  House,
  Inbox,
  PanelLeft,
  PanelLeftClose,
  RefreshCw,
  Settings,
  Target,
  Users,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  teamBoard,
  teamCycles,
  teamHome,
  teamIssues,
  teamList,
  teamProjects,
  teamTriage,
  teamViews,
  wsHome,
  wsInitiatives,
  wsLoops,
  wsMembers,
  wsProjects,
  wsSettings,
  wsViews,
} from "@/lib/routes";
import { useUiStore } from "@/lib/ui-store";

const ICON = { strokeWidth: 1.5, size: 16 } as const;

type Team = { id: string; key: string; name: string };

export function Sidebar({
  wsSlug,
  workspaceName,
  teams,
}: {
  wsSlug: string;
  workspaceName: string;
  teams: Array<Team>;
}) {
  const pathname = usePathname();
  const open = useUiStore((s) => s.sidebarOpen);
  const toggle = useUiStore((s) => s.toggleSidebar);

  const activeTeamId =
    teams.find((t) => pathname.startsWith(`/${wsSlug}/teams/${t.id}`))?.id ??
    null;
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    activeTeamId ? { [activeTeamId]: true } : {},
  );
  const isExpanded = (id: string) => expanded[id] ?? id === activeTeamId;
  const toggleTeam = (id: string) =>
    setExpanded((s) => ({ ...s, [id]: !(s[id] ?? id === activeTeamId) }));

  if (!open) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label="Mostrar barra lateral"
        className="cursus-pressable fixed left-3 top-3 z-30 inline-flex items-center rounded-md border border-cursus-border bg-cursus-surface p-2 text-cursus-text-2"
      >
        <PanelLeft {...ICON} aria-hidden="true" />
      </button>
    );
  }

  const itemCls = (active: boolean) =>
    cn(
      "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-cursus-text-2 hover:bg-cursus-surface-2 hover:text-cursus-text-1",
      active && "bg-cursus-surface-2 font-medium text-cursus-text-1",
    );

  const link = (href: Route, label: string, icon: React.ReactNode) => {
    const active = pathname === href;
    return (
      <Link
        key={href + label}
        href={href}
        aria-current={active ? "page" : undefined}
        className={itemCls(active)}
      >
        <span aria-hidden="true" className="shrink-0">
          {icon}
        </span>
        {label}
      </Link>
    );
  };

  const teamLinks = (t: Team) => [
    { href: teamHome(wsSlug, t.id), label: "Home", icon: <House {...ICON} /> },
    {
      href: teamTriage(wsSlug, t.id),
      label: "Triage",
      icon: <Inbox {...ICON} />,
    },
    {
      href: teamIssues(wsSlug, t.id),
      label: "Issues",
      icon: <CircleDot {...ICON} />,
    },
    {
      href: teamCycles(wsSlug, t.id),
      label: "Cycles",
      icon: <RefreshCw {...ICON} />,
    },
    {
      href: teamProjects(wsSlug, t.id),
      label: "Projects",
      icon: <Briefcase {...ICON} />,
    },
    { href: teamViews(wsSlug, t.id), label: "Views", icon: <Eye {...ICON} /> },
  ];

  return (
    <aside
      className="flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-cursus-border bg-cursus-surface p-3"
      aria-label="Navegación del workspace"
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href={wsHome(wsSlug)}
          className="truncate font-display text-[15px] font-semibold text-cursus-text-1"
        >
          {workspaceName}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label="Ocultar barra lateral (Cmd+B)"
          className="cursus-pressable rounded-md p-1.5 text-cursus-text-3 hover:bg-cursus-surface-2 hover:text-cursus-text-1"
        >
          <PanelLeftClose {...ICON} aria-hidden="true" />
        </button>
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Workspace">
        <p className="px-2.5 pb-1 font-mono text-[11px] uppercase tracking-wide text-cursus-text-3">
          Workspace
        </p>
        {link(wsInitiatives(wsSlug), "Initiatives", <Target {...ICON} />)}
        {link(wsProjects(wsSlug), "Projects", <Briefcase {...ICON} />)}
        {link(wsViews(wsSlug), "Views", <Eye {...ICON} />)}
        {link(wsLoops(wsSlug), "Loops", <RefreshCw {...ICON} />)}
        {link(wsHome(wsSlug), "More", <Ellipsis {...ICON} />)}
      </nav>

      <div>
        <p className="px-2.5 pb-1 font-mono text-[11px] uppercase tracking-wide text-cursus-text-3">
          Your teams
        </p>
        <nav className="flex flex-col gap-0.5" aria-label="Your teams">
          {teams.length === 0 ? (
            <p className="px-2.5 text-[13px] text-cursus-text-3">Sin equipos</p>
          ) : null}
          {teams.map((t) => {
            const expandedNow = isExpanded(t.id);
            const teamActive =
              pathname.startsWith(`/${wsSlug}/teams/${t.id}`) &&
              (pathname === teamHome(wsSlug, t.id) || !expandedNow);
            return (
              <div key={t.id} className="flex flex-col">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleTeam(t.id)}
                    aria-expanded={expandedNow}
                    aria-label={`${expandedNow ? "Contraer" : "Expandir"} equipo ${t.name}`}
                    className="cursus-pressable rounded-md p-1.5 text-cursus-text-3 hover:bg-cursus-surface-2 hover:text-cursus-text-1"
                  >
                    {expandedNow ? (
                      <ChevronDown size={14} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={14} aria-hidden="true" />
                    )}
                  </button>
                  <Link
                    href={teamHome(wsSlug, t.id)}
                    aria-current={teamActive ? "page" : undefined}
                    className={cn(itemCls(teamActive), "min-w-0 flex-1")}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-cursus-border bg-cursus-surface-2 font-mono text-[10px] font-semibold text-cursus-text-2"
                    >
                      {t.key.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="truncate">{t.name}</span>
                  </Link>
                </div>
                {expandedNow ? (
                  <div className="ml-6 flex flex-col gap-0.5 border-l border-cursus-border pl-1.5">
                    {teamLinks(t).map((l) => {
                      const active =
                        pathname === l.href ||
                        (l.label === "Issues" &&
                          (pathname === teamBoard(wsSlug, t.id) ||
                            pathname === teamList(wsSlug, t.id)));
                      return (
                        <Link
                          key={l.href + l.label}
                          href={l.href}
                          aria-current={active ? "page" : undefined}
                          className={itemCls(active)}
                        >
                          <span aria-hidden="true" className="shrink-0">
                            {l.icon}
                          </span>
                          {l.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto flex flex-col gap-0.5">
        {link(wsMembers(wsSlug), "Miembros", <Users {...ICON} />)}
        {link(wsSettings(wsSlug), "Ajustes", <Settings {...ICON} />)}
        <Link
          href="/sign-out"
          className="block rounded-md px-2.5 py-1.5 text-[13px] text-cursus-text-3 hover:bg-cursus-surface-2 hover:text-cursus-text-1"
        >
          Cerrar sesión
        </Link>
      </div>
    </aside>
  );
}
