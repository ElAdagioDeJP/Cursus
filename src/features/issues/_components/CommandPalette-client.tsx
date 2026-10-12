/** Paleta Cmd+K (cmdk): ir, buscar, crear. Carga diferida desde el layout. */
"use client";

import { Command } from "cmdk";
import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { IssueListRow } from "@/db/types";
import {
  issueDetail,
  teamBoard,
  teamList,
  teamProjects,
  wsHome,
} from "@/lib/routes";
import { useUiStore } from "@/lib/ui-store";
import { Kbd } from "@/ui/Kbd";
import { searchIssuesAction } from "../actions";

export function CommandPalette() {
  const router = useRouter();
  const params = useParams<{ wsSlug: string; teamId?: string }>();
  const wsSlug = params.wsSlug;
  const teamId = params.teamId;
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<IssueListRow[]>([]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await searchIssuesAction(wsSlug, q.trim(), 8);
        setResults(r);
      } catch {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q, wsSlug]);

  const go = (href: Route) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        className="cursus-palette-panel fixed left-1/2 top-[20vh] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-lg border border-cursus-border bg-cursus-surface"
      >
        <Command label="Paleta de comandos">
          <Command.Input
            autoFocus
            value={q}
            onValueChange={setQ}
            placeholder="Buscar incidencias o ir a…"
            aria-label="Buscar o ir a"
            className="w-full border-b border-cursus-border bg-transparent px-4 py-3 text-sm text-cursus-text-1 placeholder:text-cursus-text-3"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-cursus-text-3">
              Sin resultados. Escribe al menos 2 caracteres.
            </Command.Empty>
            {results.length > 0 && (
              <Command.Group heading="Incidencias">
                {results.map((i) => (
                  <Command.Item
                    key={i.id}
                    value={`${i.identifier} ${i.title}`}
                    onSelect={() => go(issueDetail(wsSlug, i.team_id, i.id))}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-cursus-text-1 aria-selected:bg-cursus-surface-2"
                  >
                    <span className="font-mono text-xs text-cursus-text-2">
                      {i.identifier}
                    </span>
                    <span className="line-clamp-1">{i.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            <Command.Group heading="Ir a">
              {teamId ? (
                <>
                  <Command.Item
                    onSelect={() => go(teamBoard(wsSlug, teamId))}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-cursus-text-1 aria-selected:bg-cursus-surface-2"
                  >
                    Tablero del equipo
                  </Command.Item>
                  <Command.Item
                    onSelect={() => go(teamList(wsSlug, teamId))}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-cursus-text-1 aria-selected:bg-cursus-surface-2"
                  >
                    Lista del equipo
                  </Command.Item>
                  <Command.Item
                    onSelect={() => go(teamProjects(wsSlug, teamId))}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-cursus-text-1 aria-selected:bg-cursus-surface-2"
                  >
                    Proyectos
                  </Command.Item>
                </>
              ) : null}
              <Command.Item
                onSelect={() => go(wsHome(wsSlug))}
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-cursus-text-1 aria-selected:bg-cursus-surface-2"
              >
                Inicio del workspace
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="flex items-center gap-3 border-t border-cursus-border px-4 py-2 text-xs text-cursus-text-3">
            <span className="flex items-center gap-1">
              <Kbd>↑↓</Kbd> navegar
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> abrir
            </span>
            <span className="flex items-center gap-1">
              <Kbd>esc</Kbd> cerrar
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursus-pressable ml-auto rounded-md px-2 py-1 text-cursus-text-2 hover:bg-cursus-surface-2 hover:text-cursus-text-1"
            >
              Cerrar
            </button>
          </div>
        </Command>
      </div>
    </div>
  );
}
