/** Setup: seed demo + sesión E2E (bypass OAuth) + storageState. */
import { mkdirSync, writeFileSync } from "node:fs";
import { test as setup } from "@playwright/test";
import { getSql } from "../src/db/client";
import { createE2ESession, seedDemo } from "../src/db/seeds";

setup("prepara workspace demo", async ({ baseURL }) => {
  await seedDemo();
  const { cookieValue } = await createE2ESession();
  const sql = getSql();
  const team = await sql`select id from teams where key = 'CUR' limit 1`;
  const teamId = String((team[0] as { id: string }).id);
  const url = new URL(baseURL ?? "http://localhost:3000");
  const state = {
    cookies: [
      {
        name: "authjs.session-token",
        value: cookieValue,
        domain: url.hostname,
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax" as const,
        expires: -1,
      },
    ],
    origins: [],
  };
  mkdirSync("e2e/.auth", { recursive: true });
  writeFileSync("e2e/.auth/state.json", JSON.stringify(state));
  writeFileSync(
    "e2e/.auth/env.json",
    JSON.stringify({ wsSlug: "demo", teamId }),
  );
});
