import {
  ArrowRight,
  GitPullRequest,
  Kanban,
  ListFilter,
  Radio,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Kbd } from "@/ui/Kbd";
import {
  Faq,
  HeroEnter,
  MarketingNav,
  PaletteDemo,
  Reveal,
  SequenceDemo,
} from "./_components/marketing-motion";

/* Landing Cursus (VARIANCE 7 / MOTION 6 / DENSITY 4).
   Shape lock: botones rounded-md 6px, paneles rounded-lg 8px, pills full.
   Acento único: Señal. Theme lock: dark. Textos ES, código EN. */

export const metadata: Metadata = {
  title: "Cursus — Gestión de trabajo, sin ruido",
  description:
    "Tablero, lista y paleta de comandos para equipos que viven en el teclado. 6 estados, 5 prioridades, historial completo.",
};

const ICON = { strokeWidth: 1.5, size: 16 } as const;
const FLOW = [
  "Backlog",
  "Por hacer",
  "En curso",
  "En revisión",
  "Hecho",
] as const;
/* Marquee decorativa: claves estables precalculadas, sin índice en key. */
const MARQUEE_A = FLOW.flatMap((label) =>
  (["a1", "a2", "a3"] as const).map((copy) => ({
    label,
    id: `${label}-${copy}`,
  })),
);
const MARQUEE_B = FLOW.flatMap((label) =>
  (["b1", "b2", "b3"] as const).map((copy) => ({
    label,
    id: `${label}-${copy}`,
  })),
);

const SHORTCUTS = [
  { k: "⌘K", d: "Paleta: buscar, ir, crear" },
  { k: "C", d: "Nueva incidencia al instante" },
  { k: "F", d: "Saltar al buscador de la lista" },
  { k: "?", d: "Ver todos los atajos" },
] as const;

const BOARD = [
  {
    col: "Por hacer",
    dot: "bg-flow-todo",
    cards: [
      { id: "CUR-121", t: "Definir alcance sprint" },
      { id: "CUR-122", t: "Revisar permisos API" },
    ],
  },
  {
    col: "En curso",
    dot: "bg-flow-in-progress",
    cards: [{ id: "CUR-123", t: "Tablero con arrastre" }],
  },
  {
    col: "Hecho",
    dot: "bg-flow-done",
    cards: [{ id: "CUR-118", t: "Paleta de comandos" }],
  },
] as const;

export default function MarketingPage() {
  return (
    <div className="bg-cursus-bg text-cursus-text-1">
      <MarketingNav />
      <main>
        {/* HERO split: copy izquierda, producto vivo derecha. Cabe sin scroll al CTA. */}
        <section className="cursus-pattern-grid relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-14 pt-14 sm:px-6 md:grid-cols-2 md:pt-20">
            <HeroEnter>
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
                  Tablero, lista y paleta de comandos para equipos que viven en
                  el teclado.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/sign-in"
                    className="cursus-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-cursus-primary px-5 py-2.5 text-sm font-medium text-cursus-on-primary hover:bg-cursus-primary-hover"
                  >
                    Entrar ahora
                    <ArrowRight {...ICON} aria-hidden="true" />
                  </Link>
                  <Link
                    href="/nosotros"
                    className="cursus-pressable inline-flex min-h-11 items-center justify-center rounded-md border border-cursus-border px-5 py-2.5 text-sm text-cursus-text-1 hover:bg-cursus-surface-2"
                  >
                    Quiénes somos
                  </Link>
                </div>
                <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-cursus-border pt-5">
                  {[
                    ["6", "estados claros"],
                    ["5", "prioridades"],
                    ["0", "ratón exigido"],
                  ].map(([n, label]) => (
                    <div key={label}>
                      <dt className="sr-only">{label}</dt>
                      <dd className="font-display text-2xl font-semibold">
                        {n}
                      </dd>
                      <dd className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-cursus-text-3">
                        {label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </HeroEnter>

            {/* Preview vivo con componentes reales, animado con vida */}
            <HeroEnter>
              <div className="flex flex-col gap-3">
                <div
                  role="img"
                  aria-label="Vista previa del tablero Cursus con tres columnas"
                  className="cursus-hero-float overflow-hidden rounded-lg border border-cursus-border bg-cursus-surface shadow-[0_20px_60px_-30px_rgba(255,107,44,0.35)]"
                >
                  <div className="flex items-center gap-2 border-b border-cursus-border px-4 py-2.5">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full bg-cursus-primary"
                    />
                    <span className="font-mono text-xs text-cursus-text-2">
                      CUR-123 · En curso
                    </span>
                    <span className="ml-auto">
                      <Kbd>⌘K</Kbd>
                    </span>
                  </div>
                  <ul className="grid grid-cols-1 gap-px bg-cursus-border sm:grid-cols-3">
                    {BOARD.map((c) => (
                      <li key={c.col} className="bg-cursus-surface p-3">
                        <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-cursus-text-3">
                          <span
                            aria-hidden="true"
                            className={`h-1.5 w-1.5 rounded-full ${c.dot}`}
                          />
                          {c.col}
                        </p>
                        <div className="mt-2 flex flex-col gap-2">
                          {c.cards.map((card) => (
                            <div
                              key={card.id}
                              className="rounded-lg border border-cursus-border bg-cursus-bg p-2.5"
                            >
                              <p className="font-mono text-[11px] text-cursus-text-2">
                                {card.id}
                              </p>
                              <p className="mt-0.5 text-[13px] font-medium">
                                {card.t}
                              </p>
                            </div>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="cursus-hero-float-delayed">
                  <PaletteDemo />
                </div>
              </div>
            </HeroEnter>
          </div>
        </section>

        {/* FRANJA flujo: única marquee de la página */}
        <section
          aria-label="Flujo de trabajo"
          className="overflow-hidden border-y border-cursus-border bg-cursus-surface"
        >
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <div className="cursus-pattern-flow cursus-flow-dash py-4">
              <div className="flex overflow-hidden" aria-hidden="true">
                <ol className="cursus-marquee-track flex shrink-0 items-center gap-2 pr-2 font-mono text-xs text-cursus-text-2">
                  {MARQUEE_A.map((item) => (
                    <li
                      key={item.id}
                      className="shrink-0 rounded-full border border-cursus-border bg-cursus-bg px-3 py-1"
                    >
                      {item.label}
                    </li>
                  ))}
                </ol>
                <ol
                  className="cursus-marquee-track flex shrink-0 items-center gap-2 pr-2 font-mono text-xs text-cursus-text-2"
                  aria-hidden="true"
                >
                  {MARQUEE_B.map((item) => (
                    <li
                      key={item.id}
                      className="shrink-0 rounded-full border border-cursus-border bg-cursus-bg px-3 py-1"
                    >
                      {item.label}
                    </li>
                  ))}
                </ol>
              </div>
              <p className="sr-only">
                El trabajo avanza por Backlog, Por hacer, En curso, En revisión
                y Hecho.
              </p>
            </div>
          </div>
        </section>

        {/* PRODUCTO: bento asimétrico 5 celdas, sin eyebrow */}
        <section
          id="producto"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-24"
        >
          <Reveal>
            <h2 className="max-w-[20ch] font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Todo lo esencial, nada que estorbe
            </h2>
            <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-cursus-text-2">
              Espacios de trabajo, equipos, proyectos e incidencias con el
              historial completo de cada cambio.
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Reveal className="md:col-span-2" delay={0.05}>
              <article className="flex h-full flex-col justify-between gap-6 rounded-lg border border-cursus-border bg-cursus-surface p-6">
                <Kanban
                  {...ICON}
                  aria-hidden="true"
                  className="text-cursus-primary"
                />
                <div>
                  <h3 className="font-display text-xl font-semibold">
                    Tablero que se mueve contigo
                  </h3>
                  <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-cursus-text-2">
                    Arrastra entre columnas, filtra por equipo y sigue el estado
                    real sin recargar. Seis estados claros de principio a fin.
                  </p>
                </div>
              </article>
            </Reveal>
            <Reveal delay={0.1}>
              <article className="flex h-full flex-col justify-between gap-6 rounded-lg border border-cursus-border bg-cursus-primary-soft p-6">
                <Zap
                  {...ICON}
                  aria-hidden="true"
                  className="text-cursus-primary"
                />
                <div>
                  <h3 className="font-display text-xl font-semibold">
                    Paleta al instante
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-cursus-text-2">
                    Buscar, ir y crear sin levantar las manos del teclado.
                  </p>
                </div>
              </article>
            </Reveal>
            <Reveal delay={0.05}>
              <article className="flex h-full flex-col justify-between gap-6 rounded-lg border border-cursus-border bg-cursus-surface p-6">
                <ListFilter
                  {...ICON}
                  aria-hidden="true"
                  className="text-cursus-primary"
                />
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    Lista con filtros en la URL
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-cursus-text-2">
                    Comparte vistas con un enlace. Lo que ves es lo que envías.
                  </p>
                </div>
              </article>
            </Reveal>
            <Reveal delay={0.1}>
              <article className="flex h-full flex-col justify-between gap-6 rounded-lg border border-cursus-border bg-cursus-surface p-6">
                <GitPullRequest
                  {...ICON}
                  aria-hidden="true"
                  className="text-cursus-primary"
                />
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    GitHub de ida y vuelta
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-cursus-text-2">
                    Los pull requests mueven incidencias solos. Sin copiar
                    enlaces.
                  </p>
                </div>
              </article>
            </Reveal>
            <Reveal delay={0.15}>
              <article className="flex h-full flex-col justify-between gap-6 rounded-lg border border-cursus-border bg-cursus-surface p-6">
                <Radio
                  {...ICON}
                  aria-hidden="true"
                  className="text-cursus-primary"
                />
                <div>
                  <h3 className="font-display text-lg font-semibold">
                    Tiempo real por equipo
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-cursus-text-2">
                    Cambios al momento con reconexión automática. Sin
                    actualizar.
                  </p>
                </div>
              </article>
            </Reveal>
          </div>
        </section>

        {/* TECLADO: stack + demo viva */}
        <section
          id="teclado"
          className="border-y border-cursus-border bg-cursus-surface"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
            <Reveal>
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                  Todo sin soltar el teclado
                </h2>
                <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-cursus-text-2">
                  Las acciones de teclado abren al instante. Sin animaciones que
                  te frenen cuando repites 100 veces al día.
                </p>
                <ul className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-cursus-border bg-cursus-border sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {SHORTCUTS.map((r) => (
                    <li
                      key={r.k}
                      className="flex items-center justify-between gap-4 bg-cursus-bg px-5 py-4"
                    >
                      <span className="text-sm text-cursus-text-1">{r.d}</span>
                      <Kbd>{r.k}</Kbd>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 flex items-center gap-2 text-[13px] text-cursus-text-3">
                  <ShieldCheck {...ICON} aria-hidden="true" />
                  Respetamos tu movimiento: todo se detiene con movimiento
                  reducido.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex h-full flex-col gap-3">
                <PaletteDemo />
                <div className="rounded-lg border border-cursus-border bg-cursus-bg p-5">
                  <p className="font-mono text-[11px] uppercase tracking-wide text-cursus-text-3">
                    Secuencia habitual
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <SequenceDemo />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* NOSOTROS preview editorial */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-5">
            <Reveal className="lg:col-span-3">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                  Hecho por un equipo que odia el ruido
                </h2>
                <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-cursus-text-2">
                  Somos un equipo pequeño construyendo la herramienta que
                  queríamos usar: rápida, legible y amable con el teclado. Sin
                  tableros infinitos ni campos obligatorios absurdos.
                </p>
                <Link
                  href="/nosotros"
                  className="cursus-pressable mt-6 inline-flex min-h-10 items-center gap-2 rounded-md border border-cursus-border px-5 py-2.5 text-sm hover:bg-cursus-surface-2"
                >
                  Conócenos
                  <ArrowRight {...ICON} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-2">
              <ul className="grid grid-cols-1 gap-3">
                {[
                  ["Claridad", "Un estado, una prioridad, un responsable."],
                  ["Velocidad", "Abrir, crear y mover en milisegundos."],
                  ["Trazabilidad", "Historial completo de cada incidencia."],
                ].map(([t, d]) => (
                  <li
                    key={t}
                    className="rounded-lg border border-cursus-border bg-cursus-surface px-5 py-4"
                  >
                    <p className="font-display text-base font-semibold">{t}</p>
                    <p className="mt-1 text-sm text-cursus-text-2">{d}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* PREGUNTAS */}
        <section
          id="preguntas"
          className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-16 sm:px-6 md:pb-24"
        >
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cursus-primary">
              Preguntas
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Lo que nos preguntan siempre
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <Faq />
          </Reveal>
        </section>

        {/* CIERRE */}
        <section className="border-t border-cursus-border bg-cursus-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 md:py-20">
            <Reveal>
              <h2 className="mx-auto max-w-[18ch] font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Empieza tu próximo sprint hoy
              </h2>
              <p className="mx-auto mt-3 max-w-[48ch] text-[15px] text-cursus-text-2">
                Crea tu espacio, invita al equipo y mueve tu primera incidencia
                en minutos.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/sign-in"
                  className="cursus-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-cursus-primary px-6 py-2.5 text-sm font-medium text-cursus-on-primary hover:bg-cursus-primary-hover"
                >
                  Entrar ahora
                  <ArrowRight {...ICON} aria-hidden="true" />
                </Link>
                <Link
                  href="/terminos"
                  className="cursus-pressable inline-flex min-h-11 items-center justify-center rounded-md border border-cursus-border px-6 py-2.5 text-sm hover:bg-cursus-surface-2"
                >
                  Leer condiciones
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-cursus-border">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/brand/logotipo-horizontal-dark.svg"
              alt="cursus"
              width={110}
              height={24}
            />
            <p className="mt-3 max-w-[28ch] text-[13px] leading-relaxed text-cursus-text-3">
              Gestión de trabajo sin ruido para equipos que viven en el teclado.
            </p>
          </div>
          <nav aria-label="Producto">
            <p className="font-mono text-[11px] uppercase tracking-wide text-cursus-text-3">
              Producto
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                <a
                  href="/#producto"
                  className="text-cursus-text-2 hover:text-cursus-text-1"
                >
                  Funciones
                </a>
              </li>
              <li>
                <a
                  href="/#teclado"
                  className="text-cursus-text-2 hover:text-cursus-text-1"
                >
                  Atajos
                </a>
              </li>
              <li>
                <Link
                  href="/sign-in"
                  className="text-cursus-text-2 hover:text-cursus-text-1"
                >
                  Entrar
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Empresa">
            <p className="font-mono text-[11px] uppercase tracking-wide text-cursus-text-3">
              Empresa
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                <Link
                  href="/nosotros"
                  className="text-cursus-text-2 hover:text-cursus-text-1"
                >
                  Quiénes somos
                </Link>
              </li>
              <li>
                <a
                  href="/#preguntas"
                  className="text-cursus-text-2 hover:text-cursus-text-1"
                >
                  Preguntas
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Legal">
            <p className="font-mono text-[11px] uppercase tracking-wide text-cursus-text-3">
              Legal
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                <Link
                  href="/privacidad"
                  className="text-cursus-text-2 hover:text-cursus-text-1"
                >
                  Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-cursus-text-2 hover:text-cursus-text-1"
                >
                  Condiciones
                </Link>
              </li>
              <li>
                <Link
                  href="/api/health"
                  className="text-cursus-text-2 hover:text-cursus-text-1"
                >
                  Estado
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-cursus-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-[13px] text-cursus-text-3 sm:flex-row sm:items-center sm:px-6">
            <p>© 2026 Cursus. Todos los derechos reservados.</p>
            <p className="sm:ml-auto">Hecho con teclado, sin ruido.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
