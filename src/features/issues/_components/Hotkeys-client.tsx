/** Atajos globales (§1.3): Cmd+K, Cmd+B, F, G+secuencias, C, ?. */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { teamBoard, teamList, wsHome } from "@/lib/routes";
import { useUiStore } from "@/lib/ui-store";
import { Kbd } from "@/ui/Kbd";

const HELP: Array<[string, string]> = [
  ["Cmd/Ctrl K", "Abrir paleta"],
  ["Cmd/Ctrl B", "Mostrar u ocultar barra lateral"],
  ["F", "Ir al buscador"],
  ["G luego B", "Ir al tablero"],
  ["G luego L", "Ir a la lista"],
  ["G luego I", "Inicio del workspace"],
  ["C", "Nueva incidencia (enfoca el título)"],
  ["?", "Esta ayuda"],
];

export function Hotkeys() {
  const router = useRouter();
  const params = useParams<{ wsSlug: string; teamId?: string }>();
  const wsSlug = params.wsSlug;
  const teamId = params.teamId;
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useHotkeys([
    { combo: "cmd+k", handler: () => setPaletteOpen(true) },
    { combo: "ctrl+k", handler: () => setPaletteOpen(true) },
    { combo: "cmd+b", handler: () => toggleSidebar() },
    { combo: "ctrl+b", handler: () => toggleSidebar() },
    {
      combo: "f",
      handler: () => document.getElementById("cursus-filter-q")?.focus(),
    },
    { combo: "g", handler: () => undefined },
    {
      combo: "b",
      sequence: "g",
      handler: () => teamId && router.push(teamBoard(wsSlug, teamId)),
    },
    {
      combo: "l",
      sequence: "g",
      handler: () => teamId && router.push(teamList(wsSlug, teamId)),
    },
    { combo: "i", sequence: "g", handler: () => router.push(wsHome(wsSlug)) },
    {
      combo: "c",
      handler: () => {
        const title = document.getElementById(
          "cursus-new-issue-title",
        ) as HTMLInputElement | null;
        if (title) {
          title.focus();
          title.scrollIntoView({ block: "center" });
          return;
        }
        document.getElementById("cursus-new-issue-open")?.click();
      },
    },
    { combo: "?", handler: () => setHelpOpen((v) => !v) },
    {
      combo: "escape",
      handler: () => {
        setHelpOpen(false);
        setPaletteOpen(false);
      },
    },
  ]);

  if (!helpOpen)
    return mounted ? (
      <span data-testid="hotkeys-ready" className="hidden" aria-hidden="true" />
    ) : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <span data-testid="hotkeys-ready" className="hidden" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Atajos de teclado"
        className="cursus-palette-panel w-full max-w-sm rounded-lg border border-cursus-border bg-cursus-surface p-5"
      >
        <h2 className="mb-3 font-display font-semibold text-cursus-text-1">
          Atajos de teclado
        </h2>
        <ul className="flex flex-col gap-2 text-sm text-cursus-text-1">
          {HELP.map(([k, desc]) => (
            <li key={k} className="flex items-center justify-between gap-4">
              <span className="text-cursus-text-2">{desc}</span>
              <Kbd>{k}</Kbd>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setHelpOpen(false)}
          className="cursus-pressable mt-4 w-full rounded-md border border-cursus-border px-4 py-2 text-sm text-cursus-text-1 hover:bg-cursus-surface-2"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
