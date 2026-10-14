/**
 * Rutas públicas del middleware (sin sesión). Puro y testeable.
 * OJO al añadir APIs: todo lo que sea webhook o asset estático debe ir
 * aquí, o el middleware lo redirige a /sign-in y rompe la integración.
 */
const PUBLIC_PREFIXES = [
  "/_next",
  "/favicon",
  "/brand",
  "/og.svg",
  "/sign-in",
  "/sign-out",
  "/api/auth",
  "/api/health",
  "/api/mcp",
  "/api/webhooks",
];

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}
