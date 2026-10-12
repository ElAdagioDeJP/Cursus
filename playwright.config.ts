import "dotenv/config";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /setup\.ts/ },
    { name: "auth", testMatch: /auth\.spec\.ts/ },
    {
      name: "app",
      testMatch: /(board|palette)\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: "e2e/.auth/state.json" },
    },
  ],
  webServer: {
    command: "bun run dev -p 3000",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
