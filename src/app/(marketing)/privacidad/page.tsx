import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "../_components/marketing-motion";

export const metadata: Metadata = {
  title: "Privacidad — Cursus",
  description:
    "Cómo trata Cursus tus datos: qué recogemos, para qué, cuánto guardamos y qué derechos tienes.",
};

const SECTIONS = [
  {
    h: "Qué recogemos",
    p: "Cuenta (nombre, correo e imagen del proveedor OAuth), contenido de trabajo (espacios, equipos, proyectos, incidencias, comentarios e historial) y datos técnicos mínimos (registros de acceso y estado del servicio). No recogemos datos que no necesitemos para operar.",
  },
  {
    h: "Para qué lo usamos",
    p: "Autenticarte, mostrar tu trabajo, aplicar permisos por rol, enviar notificaciones operativas y mantener la seguridad. Nunca vendemos tus datos ni los usamos para publicidad.",
  },
  {
    h: "Base y conservación",
    p: "Tratamos datos para ejecutar el servicio y por interés legítimo en la seguridad. Conservamos el contenido mientras el espacio exista y los registros técnicos un máximo de 12 meses. Puedes pedir la supresión de tu cuenta en cualquier momento.",
  },
  {
    h: "Con quién lo compartimos",
    p: "Proveedores de infraestructura y autenticación (alojamiento, OAuth de GitHub o Google) solo para prestar el servicio. Integración con GitHub solo si la conectas: procesamos eventos de pull requests para actualizar incidencias.",
  },
  {
    h: "Seguridad",
    p: "Sesiones con caducidad, control de pertenencia antes de cada escritura, claves API solo con hash y alcances limitados, y confirmación explícita para acciones destructivas vía MCP.",
  },
  {
    h: "Tus derechos",
    p: "Acceso, rectificación, supresión, oposición, limitación y portabilidad. Escríbenos desde tu correo de cuenta y respondemos en un máximo de 30 días.",
  },
];

export default function PrivacidadPage() {
  return (
    <div className="bg-cursus-bg text-cursus-text-1">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cursus-primary">
          Legal
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
          Política de privacidad
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-cursus-text-2">
          Última actualización: octubre de 2026. Lenguaje claro, sin letra
          pequeña.
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
          ¿Dudas? Vuelve al{" "}
          <Link href="/" className="underline hover:text-cursus-text-1">
            inicio
          </Link>{" "}
          o revisa las{" "}
          <Link href="/terminos" className="underline hover:text-cursus-text-1">
            condiciones del servicio
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
