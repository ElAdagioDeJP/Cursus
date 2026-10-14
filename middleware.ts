/**
 * Middleware Edge-safe: NO importa auth/config (postgres no corre en Edge).
 * Solo redirect rápido si no hay cookie de sesión; la verificación real
 * vive en layouts via requireSession/requireMembership (Node).
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isPublicPath } from "@/lib/public-paths";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");
  if (!hasSession) return NextResponse.redirect(new URL("/sign-in", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
