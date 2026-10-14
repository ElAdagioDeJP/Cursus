"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Kbd } from "@/ui/Kbd";

/* Hojas cliente aisladas: todo lo que usa Motion vive aquí.
   Server Components solo componen layout estático. */

const EASE = [0.32, 0.72, 0, 1] as const;

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: [...EASE] }}
    >
      {children}
    </motion.div>
  );
}

export function HeroEnter({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [...EASE] }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children }: { children: React.ReactNode[] }) {
  const reduce = useReducedMotion();
  return (
    <>
      {children.map((child, i) => (
        <motion.div
          // biome-ignore lint/suspicious/noArrayIndexKey: orden fijo de demo, sin reorden
          key={i}
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.15 + i * 0.07,
            ease: [...EASE],
          }}
        >
          {child}
        </motion.div>
      ))}
    </>
  );
}

export function SequenceDemo() {
  return (
    <Stagger>
      {["⌘K buscar CUR-123", "C crear incidencia", "F filtrar lista"].map(
        (item) => (
          <p
            key={item}
            className="rounded-md bg-cursus-surface-2 px-3 py-2.5 font-mono text-xs text-cursus-text-1"
          >
            {item}
          </p>
        ),
      )}
    </Stagger>
  );
}

const NAV_LINKS = [
  { href: "/#producto", label: "Producto" },
  { href: "/#teclado", label: "Teclado" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/#preguntas", label: "Preguntas" },
] as const;

function NavLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  if (href.includes("#")) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href as "/nosotros"} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-cursus-border bg-cursus-bg/90 backdrop-blur">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Cursus inicio"
        >
          <Image
            src="/brand/logotipo-horizontal-dark.svg"
            alt="cursus"
            width={110}
            height={24}
            priority
          />
        </Link>
        <div className="ml-6 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm text-cursus-text-2 hover:bg-cursus-surface-2 hover:text-cursus-text-1"
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Link
            href="/api/health"
            className="inline-flex items-center gap-2 rounded-full border border-cursus-border px-3 py-1.5 font-mono text-xs text-cursus-text-2 hover:text-cursus-text-1"
          >
            <span className="relative flex h-2 w-2">
              <span
                aria-hidden="true"
                className="cursus-pulse-dot absolute inline-flex h-full w-full rounded-full bg-cursus-success"
              />
              <span
                aria-hidden="true"
                className="relative inline-flex h-2 w-2 rounded-full bg-cursus-success"
              />
            </span>
            Operativo
          </Link>
          <Link
            href="/sign-in"
            className="cursus-pressable inline-flex min-h-9 items-center rounded-md bg-cursus-primary px-4 py-2 text-sm font-medium text-cursus-on-primary hover:bg-cursus-primary-hover"
          >
            Entrar
          </Link>
        </div>
        <button
          type="button"
          className="cursus-pressable ml-auto inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-cursus-border md:hidden"
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [...EASE] }}
            className="border-t border-cursus-border bg-cursus-bg px-4 pb-4 pt-2 md:hidden"
          >
            <ul className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <NavLink
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-3 text-[15px] text-cursus-text-1 hover:bg-cursus-surface-2"
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
              <li className="mt-2 flex gap-2">
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className="cursus-pressable inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-cursus-primary px-4 text-sm font-medium text-cursus-on-primary"
                >
                  Entrar
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

const PALETTE_QUERIES = [
  "CUR-123",
  "retraso entrega",
  "crear incidencia",
  "ir al tablero",
];

export function PaletteDemo() {
  const reduce = useReducedMotion();
  const [qi, setQi] = useState(0);
  const [text, setText] = useState("");
  useEffect(() => {
    if (reduce) {
      setText(PALETTE_QUERIES[0] ?? "");
      return;
    }
    const full = PALETTE_QUERIES[qi % PALETTE_QUERIES.length] ?? "";
    let i = 0;
    setText("");
    const type = window.setInterval(() => {
      i += 1;
      setText(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(type);
        window.setTimeout(() => setQi((v) => v + 1), 1600);
      }
    }, 55);
    return () => window.clearInterval(type);
  }, [qi, reduce]);

  return (
    <div className="rounded-lg border border-cursus-border bg-cursus-bg">
      <div className="flex items-center gap-2 px-4 py-3">
        <span
          aria-hidden="true"
          className="font-mono text-sm text-cursus-text-3"
        >
          ›
        </span>
        <p
          className="min-h-5 font-mono text-sm text-cursus-text-1"
          aria-live="polite"
        >
          {text}
          <span
            aria-hidden="true"
            className="cursus-caret ml-0.5 inline-block h-4 w-px bg-cursus-primary"
          />
        </p>
        <span className="ml-auto">
          <Kbd>⌘K</Kbd>
        </span>
      </div>
      <ul className="border-t border-cursus-border">
        {[
          "CUR-123 · Cerrar sprint",
          "CUR-124 · Revisar API",
          "Crear incidencia con C",
        ].map((r, i) => (
          <li
            key={r}
            className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs ${
              i === 0
                ? "bg-cursus-surface-2 text-cursus-text-1"
                : "text-cursus-text-3"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-cursus-primary" : "bg-cursus-border-strong"}`}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

const FAQS = [
  {
    q: "¿Necesito el ratón para trabajar?",
    a: "No. Tablero, lista, filtros y creación funcionan con teclado. El ratón sigue disponible, pero nunca es obligatorio.",
  },
  {
    q: "¿Cómo se organiza el trabajo?",
    a: "Un espacio de trabajo contiene equipos y proyectos. Cada incidencia pertenece a un equipo y avanza por 6 estados: Backlog, Por hacer, En curso, En revisión, Hecho y Cancelado.",
  },
  {
    q: "¿Se integra con GitHub?",
    a: "Sí. Los eventos de pull requests actualizan incidencias de forma automática y cada cambio queda en el historial.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Sesiones con caducidad, control por rol y claves API con hash y alcances. Detalle en Privacidad y Términos.",
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <ul className="mt-8 divide-y divide-cursus-border overflow-hidden rounded-lg border border-cursus-border bg-cursus-surface">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <li key={f.q}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium hover:bg-cursus-surface-2"
            >
              {f.q}
              <motion.span
                aria-hidden="true"
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2, ease: [...EASE] }}
                className="font-mono text-lg leading-none text-cursus-primary"
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [...EASE] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed text-cursus-text-2">
                    {f.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
