import { ArrowRight, Keyboard, Layers, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav, Reveal } from "../_components/marketing-motion";

export const metadata: Metadata = {
  title: "Nosotros — Cursus",
  description:
    "Quiénes somos: un equipo pequeño que construye gestión de trabajo sin ruido, keyboard-first y con historial completo.",
};

const ICON = { strokeWidth: 1.5, size: 18 } as const;

export default function NosotrosPage() {
  return (
    <div className="bg-cursus-bg text-cursus-text-1">
      <MarketingNav />
      <main>
        <section className="cursus-pattern-grid">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cursus-primary">
                Quiénes somos
              </p>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
                Menos ruido,
                <br />
                más trabajo hecho
              </h1>
              <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-cursus-text-2">
                Cursus nace de la frustración con herramientas lentas y
                recargadas. Queríamos un tablero que abra al instante, que se
                controle con teclado y que cuente la verdad de cada incidencia.
                Eso construimos.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                icon: Keyboard,
                t: "Teclado primero",
                d: "Cada acción frecuente tiene atajo. El ratón es opcional, nunca un peaje.",
              },
              {
                icon: Zap,
                t: "Rapidez real",
                d: "Apertura instantánea donde importa. Sin animaciones que frenen tu día.",
              },
              {
                icon: Layers,
                t: "Modelo claro",
                d: "Espacio, equipo, proyecto e incidencia. Seis estados y cinco prioridades, sin inventos.",
              },
            ].map((v, i) => (
              <Reveal key={v.t} delay={i * 0.06}>
                <article className="h-full rounded-lg border border-cursus-border bg-cursus-surface p-6">
                  <v.icon
                    {...ICON}
                    aria-hidden="true"
                    className="text-cursus-primary"
                  />
                  <h2 className="mt-4 font-display text-lg font-semibold">
                    {v.t}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-cursus-text-2">
                    {v.d}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-12 rounded-lg border border-cursus-border bg-cursus-surface p-6 md:p-8">
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Cómo trabajamos
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-3 text-sm leading-relaxed text-cursus-text-2 md:grid-cols-2">
                <li className="rounded-md bg-cursus-bg px-4 py-3">
                  Decisiones pequeñas, envíos frecuentes y código que se puede
                  explicar.
                </li>
                <li className="rounded-md bg-cursus-bg px-4 py-3">
                  Accesibilidad y contraste AA desde el primer boceto, no como
                  parche.
                </li>
                <li className="rounded-md bg-cursus-bg px-4 py-3">
                  Movimiento con motivo: guía la mirada y respeta el movimiento
                  reducido.
                </li>
                <li className="rounded-md bg-cursus-bg px-4 py-3">
                  Tus datos son tuyos: exportables, con historial y supresión
                  real.
                </li>
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/sign-in"
                  className="cursus-pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-cursus-primary px-5 py-2.5 text-sm font-medium text-cursus-on-primary hover:bg-cursus-primary-hover"
                >
                  Entrar ahora
                  <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
                </Link>
                <Link
                  href="/privacidad"
                  className="cursus-pressable inline-flex min-h-11 items-center justify-center rounded-md border border-cursus-border px-5 py-2.5 text-sm hover:bg-cursus-surface-2"
                >
                  Leer privacidad
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
    </div>
  );
}
