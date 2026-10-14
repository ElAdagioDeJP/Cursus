import { z } from "zod";

/**
 * Validación zod de env (falla fast en build).
 * Solo server. Nada NEXT_PUBLIC aquí salvo NEXT_PUBLIC_APP_URL.
 * S1 amplía con guards OAuth; S4 añade CURSUS_MCP_TOKEN; S5 usa en Docker.
 */
const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL requerido")
    .default("postgresql://app:changeme@localhost:5432/app"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  AUTH_SECRET: z
    .string()
    .min(1, "AUTH_SECRET requerido")
    .default("changeme-openssl-rand-base64-32"),
  AUTH_GITHUB_ID: z.string().optional().default(""),
  AUTH_GITHUB_SECRET: z.string().optional().default(""),
  AUTH_GOOGLE_ID: z.string().optional().default(""),
  AUTH_GOOGLE_SECRET: z.string().optional().default(""),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  CURSUS_MCP_TOKEN: z.string().optional().default(""),
  POSTGRES_PASSWORD: z.string().optional().default("changeme"),
  // GitHub App estilo Linear (integración issues ↔ PRs). Todo opcional en
  // dev; en prod se exige GITHUB_WEBHOOK_SECRET si el webhook está activo.
  GITHUB_APP_ID: z.string().optional().default(""),
  GITHUB_APP_SLUG: z.string().optional().default(""),
  GITHUB_APP_PRIVATE_KEY: z.string().optional().default(""),
  GITHUB_WEBHOOK_SECRET: z.string().optional().default(""),
  GITHUB_AUTO_CLOSE_ON_MERGE: z.string().optional().default("true"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Falla fast con mensaje en español (DoD S0)
    console.error("❌ Variables de entorno inválidas:");
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error(
      "Variables de entorno inválidas. Revisa .env / .env.example.",
    );
  }
  return parsed.data;
}

export const env: Env = loadEnv();
