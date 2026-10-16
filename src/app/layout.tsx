import type { Metadata } from "next";
import "../styles/globals.css";
import { fontDisplay, fontMono, fontSans } from "./fonts";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: "Cursus — Gestión de trabajo, sin ruido",
  description:
    "Espacios de trabajo, equipos, proyectos e incidencias con tablero, lista y paleta de comandos.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Cursus — Gestión de trabajo, sin ruido",
    description:
      "Tablero, lista y paleta de comandos para equipos que viven en el teclado.",
    type: "website",
    images: [{ url: "/og.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cursus — Gestión de trabajo, sin ruido",
    description:
      "Tablero, lista y paleta de comandos para equipos que viven en el teclado.",
    images: ["/og.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`dark ${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
    >
      <body className="bg-cursus-bg text-cursus-text-1 antialiased">
        {children}
      </body>
    </html>
  );
}
