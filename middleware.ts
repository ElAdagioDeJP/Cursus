/**
 * Middleware Edge-safe: NO importa auth/config (postgres no corre en Edge).
 * Solo redirect rápido si no hay cookie de sesión; la verificación real
 * vive en layouts via requireSession/requireMembership (Node).
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/_next",
  "/favicon",
  "/sign-in",
  "/api/auth",
  "/api/health",
  "/api/mcp",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/") return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)))
    return NextResponse.next();
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");
  if (!hasSession) return NextResponse.redirect(new URL("/sign-in", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
