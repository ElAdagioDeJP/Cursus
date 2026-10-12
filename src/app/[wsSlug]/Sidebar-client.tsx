/** Barra lateral (cliente: activa + colapsable; datos del layout RSC). */
"use client";

import {
  House,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Users,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  teamBoard,
  teamList,
  wsHome,
  wsMembers,
  wsSettings,
} from "@/lib/routes";
import { useUiStore } from "@/lib/ui-store";

const ICON = { strokeWidth: 1.5, size: 16 } as const;

export function Sidebar({
  wsSlug,
  workspaceName,
  teams,
}: {
  wsSlug: string;
  workspaceName: string;
  teams: Array<{ id: string; key: string; name: string }>;
}) {
  const pathname = usePathname();
  const open = useUiStore((s) => s.sidebarOpen);
  const toggle = useUiStore((s) => s.toggleSidebar);

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

  const link = (href: Route, label: string, icon: React.ReactNode) => (
    <Link
      key={href}
      href={href}
      aria-current={pathname === href ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-cursus-text-2 hover:bg-cursus-surface-2 hover:text-cursus-text-1",
        pathname === href &&
          "bg-cursus-surface-2 font-medium text-cursus-text-1",
      )}
    >
      <span aria-hidden="true" className="shrink-0">
        {icon}
      </span>
      {label}
    </Link>
  );

  return (
    <aside
      className="flex w-60 shrink-0 flex-col gap-4 border-r border-cursus-border bg-cursus-surface p-3"
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
      <nav className="flex flex-col gap-0.5" aria-label="Secciones">
        {link(wsHome(wsSlug), "Inicio", <House {...ICON} />)}
        {link(wsMembers(wsSlug), "Miembros", <Users {...ICON} />)}
        {link(wsSettings(wsSlug), "Ajustes", <Settings {...ICON} />)}
      </nav>
      <div>
        <p className="px-2.5 pb-1 font-mono text-[11px] uppercase tracking-wide text-cursus-text-3">
          Equipos
        </p>
        <nav className="flex flex-col gap-0.5" aria-label="Equipos">
          {teams.length === 0 ? (
            <p className="px-2.5 text-[13px] text-cursus-text-3">Sin equipos</p>
          ) : null}
          {teams.map((t) => (
            <div key={t.id}>
              <p className="px-2.5 pt-1.5 text-xs font-medium text-cursus-text-1">
                <span className="font-mono text-cursus-text-2">{t.key}</span>{" "}
                {t.name}
              </p>
              {link(
                teamBoard(wsSlug, t.id),
                "Tablero",
                <PanelLeft {...ICON} />,
              )}
              {link(teamList(wsSlug, t.id), "Lista", <House {...ICON} />)}
            </div>
          ))}
        </nav>
      </div>
      <div className="mt-auto">
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
