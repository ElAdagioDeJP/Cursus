import { ArrowRight, Command, Keyboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Kbd } from "@/ui/Kbd";

/* Landing contenida (VARIANCE 6 / MOTION 5 / DENSITY 3).
   Shape lock: botones 6px, paneles 8px, pills full. Acento único: Señal.
   Theme lock: dark por defecto, coherente en todas las secciones. */

const ICON = { strokeWidth: 1.5, size: 16 } as const;

export default function MarketingPage() {
  return (
    <main className="bg-cursus-bg text-cursus-text-1">
      {/* HERO split 50/50, cabe en viewport */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-16 pt-24 md:grid-cols-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cursus-primary">
            Tablero keyboard-first
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
            Gestión de trabajo,
            <br />
            sin ruido
          </h1>
          <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed text-cursus-text-2">
            Tablero, lista y paleta de comandos para equipos que viven en el
            teclado.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/sign-in"
              className="cursus-pressable inline-flex min-h-10 items-center gap-2 rounded-md bg-cursus-primary px-5 py-2.5 text-sm font-medium text-cursus-on-primary hover:bg-cursus-primary-hover"
            >
              Entrar ahora
              <ArrowRight {...ICON} aria-hidden="true" />
            </Link>
            <Link
              href="/api/health"
              className="cursus-pressable inline-flex min-h-10 items-center rounded-md border border-cursus-border px-5 py-2.5 text-sm text-cursus-text-1 hover:bg-cursus-surface-2"
            >
              Ver estado
            </Link>
          </div>
        </div>
        {/* TODO: hero product photo, 1200x900 — tablero real con 6 columnas en dark.
            Temporal: preview vivo con componentes reales (no fake-screenshot). */}
        <div
          role="img"
          aria-label="Vista previa del tablero"
          className="overflow-hidden rounded-lg border border-cursus-border bg-cursus-surface"
        >
          <div className="flex items-center gap-2 border-b border-cursus-border px-4 py-2.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-cursus-primary"
            />
            <span className="font-mono text-xs text-cursus-text-2">
              CUR-123 · En curso
            </span>
            <span className="ml-auto flex items-center gap-1 text-xs text-cursus-text-3">
              <Kbd>⌘K</Kbd>
            </span>
          </div>
          <ul className="grid grid-cols-3 gap-px bg-cursus-border">
            {["Por hacer", "En curso", "Hecho"].map((c, idx) => (
              <li key={c} className="bg-cursus-surface p-3">
                <p className="font-mono text-[11px] uppercase tracking-wide text-cursus-text-3">
                  {c}
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  <div className="rounded-lg border border-cursus-border p-2.5">
                    <p className="font-mono text-[11px] text-cursus-text-2">
                      CUR-12{idx}
                    </p>
                    <p className="mt-0.5 text-[13px] font-medium">
                      Incidencia de ejemplo
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FRANJA flujo: una sola familia layout (full-width track) */}
      <section
        aria-label="Flujo de trabajo"
        className="border-y border-cursus-border bg-cursus-surface"
      >
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="cursus-pattern-flow py-4">
            <ol className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-cursus-text-2">
              {["Backlog", "Por hacer", "En curso", "En revisión", "Hecho"].map(
                (s) => (
                  <li
                    key={s}
                    className="rounded-full border border-cursus-border bg-cursus-bg px-3 py-1"
                  >
                    {s}
                  </li>
                ),
              )}
            </ol>
          </div>
        </div>
      </section>

      {/* TECLADO: stack vertical con Kbd reales (familia distinta al hero) */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="max-w-[22ch] font-display text-3xl font-semibold tracking-tight">
          Todo sin soltar el teclado
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-cursus-border bg-cursus-border md:grid-cols-2">
          {[
            { k: "Cmd K", d: "Paleta: buscar, ir, crear" },
            { k: "C", d: "Nueva incidencia al instante" },
            { k: "F", d: "Saltar al buscador de la lista" },
            { k: "?", d: "Ver todos los atajos" },
          ].map((r) => (
            <li
              key={r.k}
              className="flex items-center justify-between gap-4 bg-cursus-surface px-5 py-4"
            >
              <span className="text-sm text-cursus-text-1">{r.d}</span>
              <Kbd>{r.k}</Kbd>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center gap-2 text-[13px] text-cursus-text-3">
          <Keyboard {...ICON} aria-hidden="true" />
          <Command {...ICON} aria-hidden="true" />
          Sin animación en acciones de teclado: abren al instante.
        </p>
      </section>

      {/* TODO: foto equipo real, 1600x900 — personas usando el tablero en oficina.
          TODO: textura carril, 800x800 — detalle del isotipo C-pista para el cierre. */}

      <footer className="border-t border-cursus-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-8 text-[13px] text-cursus-text-3">
          <Image
            src="/brand/logotipo-horizontal-dark.svg"
            alt="cursus"
            width={96}
            height={21}
          />
          <span className="ml-auto flex gap-4">
            <Link href="/sign-in" className="hover:text-cursus-text-1">
              Entrar
            </Link>
            <Link href="/api/health" className="hover:text-cursus-text-1">
              Estado
            </Link>
          </span>
        </div>
      </footer>
    </main>
  );
}
