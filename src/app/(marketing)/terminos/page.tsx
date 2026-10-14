import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "../_components/marketing-motion";

export const metadata: Metadata = {
  title: "Condiciones — Cursus",
  description:
    "Condiciones del servicio Cursus: tu cuenta, uso aceptable, contenido, disponibilidad y límites.",
};

const SECTIONS = [
  {
    h: "El servicio",
    p: "Cursus ofrece espacios de trabajo con equipos, proyectos e incidencias, con tablero, lista, paleta de comandos e integraciones. El servicio se presta tal cual, en evolución continua.",
  },
  {
    h: "Tu cuenta",
    p: "Accedes con OAuth (GitHub o Google). Eres responsable de mantener el acceso a tu proveedor y de las acciones hechas con tu sesión. Avísanos ante cualquier uso no autorizado.",
  },
  {
    h: "Uso aceptable",
    p: "No está permitido vulnerar la seguridad, acceder a espacios ajenos, abusar de la API, enviar spam ni subir contenido ilegal. Podemos suspender cuentas que incumplan estas reglas.",
  },
  {
    h: "Tu contenido",
    p: "Tu contenido sigue siendo tuyo. Nos concedes licencia solo para mostrarlo y operarlo dentro del servicio. Puedes exportarlo y pedir su supresión cuando quieras.",
  },
  {
    h: "Roles y permisos",
    p: "Cada espacio tiene roles Owner, Admin, Member y Guest. Toda escritura verifica tu pertenencia. Mover una incidencia de equipo cambia su identificador, sin reutilizar números.",
  },
  {
    h: "Disponibilidad y soporte",
    p: "Objetivo de disponibilidad alto pero sin garantía absoluta. Publicamos el estado en /api/health. El soporte se presta por medios electrónicos en horario laboral.",
  },
  {
    h: "Cambios y cierre",
    p: "Avisaremos de cambios relevantes con antelación razonable. Puedes cerrar tu cuenta en cualquier momento desde el cierre de sesión y la supresión posterior.",
  },
];

export default function TerminosPage() {
  return (
    <div className="bg-cursus-bg text-cursus-text-1">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cursus-primary">
          Legal
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
          Condiciones del servicio
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-cursus-text-2">
          Última actualización: octubre de 2026. Si usas Cursus, aceptas estas
          reglas.
        </p>
        <div className="mt-10 flex flex-col gap-4">
          {SECTIONS.map((s) => (
            <article
              key={s.h}
              className="rounded-lg border border-cursus-border bg-cursus-surface p-6"
            >
              <h2 className="font-display text-lg font-semibold">{s.h}</h2>
              <p className="mt-2 text-sm leading-relaxed text-cursus-text-2">
                {s.p}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm text-cursus-text-3">
          Relacionado:{" "}
          <Link
            href="/privacidad"
            className="underline hover:text-cursus-text-1"
          >
            política de privacidad
          </Link>{" "}
          y{" "}
          <Link href="/nosotros" className="underline hover:text-cursus-text-1">
            quiénes somos
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
