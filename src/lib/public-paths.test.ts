import { describe, expect, it } from "vitest";
import { isPublicPath } from "./public-paths";

describe("isPublicPath", () => {
  it("deja pasar home, login, assets y webhooks", () => {
    for (const p of [
      "/",
      "/sign-in",
      "/sign-out",
      "/brand/logotipo-horizontal-dark.svg",
      "/og.svg",
      "/favicon.svg",
      "/api/health",
      "/api/health?deep=1",
      "/api/mcp",
      "/api/auth/callback/github",
      "/api/webhooks/github",
    ]) {
      expect(isPublicPath(p)).toBe(true);
    }
  });
  it("protege workspaces y APIs con sesión", () => {
    for (const p of ["/demo", "/demo/issues", "/api/realtime/team/x"]) {
      expect(isPublicPath(p)).toBe(false);
    }
  });
});
