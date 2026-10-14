# CURSUS — Plan Maestro Web MVP
### Next.js 16 + MCP + Dokploy | `cursus.empovaro.com`

> Documento portable. Copiar/pegar en conversación nueva o repo nuevo tal cual.
> Sin dependencias de otros proyectos. Sin Drizzle. Con sistema propio de migraciones + OAuth.

---

## 0. Ficha del proyecto

| Campo | Valor |
|---|---|
| Nombre | **Cursus** |
| Dominio prod (por ahora) | `https://cursus.empovaro.com` |
| Tipo | Web MVP estilo Linear (gestión: workspaces, teams, projects, issues) |
| Stack | `Next.js 16 App Router + Turbopack + React 19 + TS estricto + Postgres 16 + Redis 7 + Auth.js v5 OAuth + postgres.js + zod v4 + nuqs + zustand + Biome + vitest + Playwright` |
| ORM | **Ninguno. SQL + `postgres.js` + sistema propio de migraciones (ver §4)** |
| Auth | **OAuth (GitHub + Google) vía Auth.js v5** (ver §5) |
| MCP | Servidor propio `POST /api/mcp` Streamable HTTP + clientes `context7`, `playwright` |
| Deploy | Dokploy + Traefik + TLS en VPS (Hetzner o similar) |
| Repo | Repo nuevo standalone (este plan asume raíz = proyecto Next, no monorepo) |
| Puertos | `3000 web / 5432 pg / 6379 redis` |

**MVP incluye:** Workspaces, Teams, Projects, Issues (board/list), Labels, Priorities 0-4, Assignees, Comments, Cmd+K, Shortcuts teclado, Realtime básico, MCP read (+write básico), `/api/health`, OAuth login, migraciones propias validadas.

**No incluye (post-MVP):** Cycles, Triage queue avanzada, Timeline/Gantt, Initiatives, SLA, Insights, Webhooks públicos, SDK público, mobile app, billing.

---

## 1. Universo de referencia (Linear) verificado y adaptado a Cursus

Fuente: `linear.app/docs`, `developers.linear.app`, `mcp.linear.app`. Verificado Oct-2026.

### 1.1 Modelo de dominio para Cursus

```text
Workspace(1)──< Team(1)──< Issue
  │              │           ├── Comment ──< Reaction
  │              │           ├── IssueLabel (m:n Label)
  │              │           ├── Subscriber (m:n User)
  │              │           ├── Relation (blocked|blocking|duplicate|related)
  │              │           └── History
  │              ├── WorkflowState (Backlog|Todo|InProgress|Review|Done|Canceled)
  │              ├── Label / LabelGroup
  │              ├── Cycle (post-MVP, 1 team)
  │              └── Template (post-MVP)
  ├── Project(1..n Teams)──< Milestone ──< Issue
  │     ├── ProjectUpdate (health, post-MVP)
  │     └── Document (spec, post-MVP)
  └── User (Owner|Admin|Member|Guest)
      ├── View (filtros guardados)
      └── ApiKey MCP (cur2_sk_...)
```

Reglas que Cursus respeta desde día 1:

- `Issue.teamId` obligatorio. 1 team por issue. Sub-issues pueden ser de otro team, máx 10 niveles.
- `identifier = TEAMKEY-number` ej `CUR-123`, `DEL-45`. Cambia al mover de team.
- `priority: 0=None, 1=Urgent, 2=High, 3=Medium, 4=Low`. Sin customs en MVP.
- `estimate T-shirt: XS=1, S=2, M=3, L=5, XL=8, XXL=13, XXXL=21`.
- `dueDate XOR SLA`, nunca juntos (SLA es post-MVP).
- Workflow MVP: `Backlog → Todo → In Progress → In Review → Done (+Canceled)`. `Triage` llega en fase 3.
- Shortcuts MVP: `C new, A assign, I assign-me, S status, P priority, L label, E estimate, Shift+D due, Cmd/Ctrl+K palette, Cmd/Ctrl+B board toggle, F filter, G+I/A/B go-to, ? help`.

### 1.2 Qué existe en Linear y qué es invento (no clonar inventos)

**Existe, clonar:** Workspace/Teams, Issues CRUD + sub + relaciones, Workflow custom (post-MVP), Triage, Cycles (post-MVP), Projects+Milestones+Updates, Initiatives (post-MVP), Labels, Comments+threads, Inbox, Views list/board + Timeline (Timeline post-MVP), Cmd+K, Estimates, Templates, `linear.new?...` deep-links, GitHub automation, Slack bi-dir, OAuth2+PAT, Webhooks HMAC, SDK.

**Invento, NO clonar:** API REST de Linear (solo existe GraphQL `POST https://api.linear.app/graphql`), entidad `Sprint` (se llama `Cycle`), `Epic` (es `Project/Initiative`), vistas nativas `Table/Calendar/Gantt` (lo real es `List/Board/Timeline`), `Roadmap` como objeto API, prioridades custom, tools MCP fijas `create_task/list_tasks` (son de MCPs comunitarios, no oficiales).

### 1.3 Matriz MVP vs Post-MVP para Cursus

| Área | MVP | Post-MVP |
|---|---|---|
| Core | Workspace, Team, User, Issue, Workflow default, Comment | Custom workflows, sub-teams, private teams, guests, templates, drafts |
| Org | Project simple, Labels, Assignee, Priority | Milestones, Initiatives, Updates+health, Deps+Graph, Docs |
| Planif | Backlog+Active list/board, Cmd+K, shortcuts base | Cycles, Triage queue, Timeline, Views custom, SLA, Estimates, Insights |
| Colab | Comments, notifs básicas | Reactions, subscribers, reminders, history completa |
| Plataforma | PAT MCP propio + OAuth login | OAuth app terceros, Webhooks HMAC, rate-limit avanzado, SDK |
| IA/MCP | MCP read-only + 8 tools write básicas | MCP full write + prompts `/triage /plan-sprint /spec-to-issues` |

Orden: Issues → Teams → Board/List → Cmd+K → Labels/Priority/Comments → Projects → OAuth hardening → Realtime → MCP-write → Deploy.

---

## 2. Arquitectura y estructura de proyecto (experto)

### 2.1 Principios

1. **Default RSC.** `"use client"` solo en hojas interactivas.
2. **Deep modules.** `features/*` solo expone `index.ts`. `_internal/` y `_components/` no se importan cross-feature (lo bloquea `dependency-cruiser` o `eslint boundaries`).
3. **Todo es datos + validación.** Ningún valor de negocio hardcodeado sin zod + test.
4. **Server Actions = única mutación.** Parsean zod, chequean membership, escriben SQL, hacen `revalidateTag` + broadcast.
5. **Sin ORM.** SQL explícito con `postgres.js`. Migraciones propias versionadas con autor (ver §4).
6. **Textos UI en español.** Código e identificadores en inglés.

### 2.2 Árbol del repo nuevo (raíz = Cursus)

```text
cursus/
  package.json            # name:cursus, packageManager bun, scripts dev/build/test/db:*
  next.config.ts          # output:standalone, typedRoutes, cacheComponents
  tsconfig.json           # strict + noUncheckedIndexedAccess + paths @/*
  middleware.ts           # guard OAuth: /:wsSlug/* requiere sesión + membership
  env.ts                  # validación zod de env (falla fast en build)
  instrumentation.ts
  biome.json
  vitest.config.ts
  playwright.config.ts
  Dockerfile
  docker-entrypoint.sh
  docker-compose.yml
  .dockerignore
  .env.example
  opencode.jsonc          # context7 + playwright + cursus-local + cursus
  public/
  src/
    app/
      (marketing)/page.tsx layout.tsx
      (auth)/sign-in/page.tsx sign-out/page.tsx
      api/auth/[...nextauth]/route.ts
      api/mcp/route.ts
      api/realtime/token/route.ts
      api/health/route.ts
      [wsSlug]/
        layout.tsx          # RSC: auth()+getWorkspace+Sidebar-server
        page.tsx            # redirect a /issues
        settings/page.tsx
        members/page.tsx
        teams/[teamId]/
          issues/page.tsx
          board/page.tsx
          list/page.tsx
          projects/page.tsx
          projects/[projectId]/page.tsx
          issues/[issueId]/page.tsx
    features/
      workspaces/index.ts queries.ts actions.ts schema.ts
      teams/index.ts queries.ts actions.ts schema.ts
      projects/index.ts queries.ts actions.ts schema.ts
      issues/
        index.ts
        queries.ts
        actions.ts
        schema.ts
        lib/ordering.ts     # lexorank puro, testeable con vitest
        _components/
          Board-server.tsx
          Board-client.tsx
          List-server.tsx
          List-client.tsx
          IssueCard.tsx
          IssueDetail-client.tsx
          FiltersBar-client.tsx
          CommandPalette-client.tsx
        _internal/          # prohibido cross-feature
    db/
      client.ts             # singleton postgres.js (globalThis en dev)
      migrate.ts            # runner propio (ver §4)
      validate.ts           # validador: nombre, autor, checksum, orden
      migrations/
        20261012080000_init.sql
        20261013090000_teams_projects.sql
        20261014100000_issues.sql
      seeds.ts
    auth/
      config.ts             # Auth.js providers + callbacks
      adapter.ts            # adapter propio sobre postgres.js (users/accounts/sessions)
      guards.ts             # requireSession(), requireMembership()
      roles.ts
    realtime/
      client.ts
      server.ts
    mcp/
      server.ts
      auth.ts
      ratelimit.ts
      tools/issues.ts
      tools/projects.ts
      tools/search.ts
      clients.ts            # consumir context7 externo
    ui/                     # design-system tonto, sin dominio
      Button.tsx Dialog.tsx Avatar.tsx Kbd.tsx EmptyState.tsx Badge.tsx
    lib/env.ts ids.ts dates.ts cn.ts
    hooks/use-hotkeys.ts
    styles/globals.css      # tailwind v4
```

### 2.3 Data flow canónico (board drag)

```text
1. RSC issues/page.tsx: searchParams (nuqs) → listIssues(teamId, filters) con cacheTag('issues:team:T')
2. → Board-server → Board-client initialData
3. Drag → useOptimistic mueve instantáneo
4. moveIssueAction({id, toStatus, toSortKey}) → zod → SQL txn + history → revalidateTag + broadcast team:T
5. Otros clientes team:T → router.refresh()
```

---

## 3. Backend — recomendación

### 3.1 Veredicto: sí, quédate así (Next.js fullstack). No crees backend separado en MVP.

| Opción | Cuándo | Costo MVP |
|---|---|---|
| **A. Next.js fullstack (recomendada)** — RSC + Server Actions + Route Handlers + `postgres.js` | MVP web, 1 deploy, 1 repo, OAuth + CRUD + MCP + realtime ligero | 1 servicio en Dokploy, 0 CORS, 0 auth duplicado |
| B. Backend separado (Hono/Elysia/Nest en Bun) + Next solo frontend | App móvil nativa, API pública terceros con versionado, workers pesados / colas, múltiples frontends | +1 deploy, +1 auth (JWT Forsage), +CORS, +contrato OpenAPI que mantener, +2-3 semanas |

**Por qué A para Cursus MVP:**

- CRUD de issues/projects es I/O Postgres, no CPU. Next Server Actions + `postgres.js` pool lo cubre (<50ms p95).
- Auth OAuth ya vive en Next (`/api/auth`). Separarlo obliga a reimplementar sesiones/JWT en dos lados.
- MCP `POST /api/mcp` es un Route Handler más. Separarlo obliga a proxy + doble rate-limit.
- Dokploy: 1 app `cursus-web:3000` + 1 Postgres + 1 Redis. Con backend separado serían 2 apps + networking interno.
- Migraciones propias (§4) corren en `docker-entrypoint.sh` del mismo contenedor. Con backend separado hay que decidir quién migra.

**Cuándo extraer backend (post-MVP):** si aparece app móvil, API pública con API keys de terceros con SLAs distintos, o workers de IA que saturan el event loop. El diseño `features/*/queries.ts + actions.ts + schema.ts` ya es puerto/adaptador: extraer es mover esos archivos a un servicio Hono sin reescribir dominio. No hacerlo antes.

**Contrato para no encerrarte:**

```text
features/issues/queries.ts  → solo SQL + tipos (sin import next/*)
features/issues/actions.ts  → thin wrapper "use server" sobre queries + guards + revalidate
features/issues/schema.ts   → zod compartible (si mañana hay Hono, importa este archivo)
```

Si mañana creas `apps/api` (Hono), reutilizas `schema.ts + queries.ts` tal cual.

---

## 4. Base de datos + sistema propio de migraciones (sin Drizzle)

### 4.1 Por qué sin Drizzle

- Cero `generate`, cero drift cliente/servidor, SQL revisable en PR, funciona igual en Bun/Node/Docker, sin magic types que se rompen con Turbopack.
- Costo: escribir SQL a mano. Se compensa con validador + tests + `schema.ts` zod como fuente de tipos de entrada.

### 4.2 Convención de archivos

```text
src/db/migrations/
  20261012080000_init.sql
  20261013090000_teams_projects.sql
  20261014100000_issues.sql
```

Formato: `YYYYMMDDHHMMSS_nombre_snake.sql`. Solo minúsculas, números, `_`. Sin espacios, sin guiones.

### 4.3 Cabecera obligatoria con autor

Cada `.sql` empieza con cabecera de metadatos. Sin cabecera completa → `db:validate` falla y CI bloquea.

```sql
-- migration: 20261014100000
-- name: issues
-- author: Juan R. <juan@delfostrading.com>
-- date: 2026-10-14
-- description: crea issues + history + índices
-- requires: 20261013090000

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title varchar(200) not null check (char_length(title) >= 3),
  description text not null default '',
  status text not null default 'backlog'
    check (status in ('backlog','todo','in_progress','review','done','canceled')),
  priority smallint not null default 3 check (priority between 0 and 4),
  assignee_id uuid references users(id) on delete set null,
  sort_key text not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists issues_team_status_sort on issues(team_id, status, sort_key);
```

Campos obligatorios: `migration, name, author (nombre + email), date, description, requires (o 'none' si es la primera)`.

### 4.4 Tabla `_migrations` + runner

```sql
create table if not exists _migrations (
  version text primary key,
  name text not null,
  author text not null,
  applied_at timestamptz not null default now(),
  checksum text not null,
  duration_ms integer not null
);
```

Runner `src/db/migrate.ts` (resumen, implementar con `postgres.js`):

```ts
// pseudocontrato
// 1. lee src/db/migrations/*.sql ordenados
// 2. parsea cabecera, valida con validate.ts
// 3. calcula sha256 del cuerpo (sin cabecera)
// 4. select version, checksum from _migrations
// 5. si version existe y checksum difiere → ERROR "migration modificada después de aplicada, crear nueva migración correctiva"
// 6. si no existe → BEGIN; ejecuta SQL; insert _migrations; COMMIT (mide duration_ms)
// 7. soporta --dry-run (solo valida + lista pendientes) y --check (usado en CI)
```

Comandos:

```bash
bun run db:validate   # valida nombres + cabeceras + orden + checksums (sin tocar DB)
bun run db:migrate    # aplica pendientes (dev, entrypoint prod)
bun run db:dry-run    # lista lo que aplicaría
bun run db:status     # aplicadas vs pendientes
```

`package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "test": "vitest run",
    "db:validate": "bun src/db/validate.ts",
    "db:migrate": "bun src/db/migrate.ts up",
    "db:dry-run": "bun src/db/migrate.ts --dry-run",
    "db:status": "bun src/db/migrate.ts status"
  }
}
```

### 4.5 Validador (qué comprueba)

`src/db/validate.ts` falla (exit 1 + mensaje en español) si:

- [ ] nombre no matchea `^\d{14}_[a-z0-9_]+\.sql$`
- [ ] falta algún campo de cabecera o `author` sin formato `Nombre <email>`
- [ ] `email` no matchea RFC simple
- [ ] `date` no es `YYYY-MM-DD` válida
- [ ] `migration` del header != timestamp del filename
- [ ] `requires` no existe o no es el anterior (orden lineal, sin huecos ni ramas en MVP)
- [ ] hay dos archivos con mismo `version`
- [ ] checksum de una migración ya aplicada difiere (detecta edición retroactiva)
- [ ] SQL contiene `drop database`, `drop schema public`, o `;--` sospechoso fuera de comentarios (deny-list básica)
- [ ] archivo vacío o sin `;`

CI lo corre antes de build. Dokploy `docker-entrypoint.sh` corre `db:validate && db:migrate` antes de `next start`.

### 4.6 Schema inicial mínimo (3 migraciones)

**`..._init.sql`:** `users, workspaces, memberships` + `updated_at` trigger.
**`..._teams_projects.sql`:** `teams (key unique por workspace), projects, labels`.
**`..._issues.sql`:** `issues, issue_history, comments` (ver ejemplo §4.3) + seeds dev separados en `src/db/seeds.ts` (nunca en migración).

Tipos TS: a mano en `src/db/types.ts` + zod de entrada en `features/*/schema.ts`. Sin generar.

---

## 5. Auth — OAuth (ingreso)

### 5.1 Decisión

**Auth.js v5 (`next-auth@beta`) + adapter propio sobre `postgres.js` + providers GitHub y Google.** Sin Clerk (lock-in + costo), sin password en MVP (menos superficie: sin hash, sin reset, sin rate-limit login). Password solo post-MVP si se pide.

### 5.2 Tablas (creadas en `..._init.sql`)

```sql
users(id uuid pk, name text, email citext unique, image text, created_at timestamptz);
accounts(user_id fk, provider text, provider_account_id text, refresh_token text, access_token text, expires_at int, pk(user_id, provider));
sessions(session_token pk, user_id fk, expires timestamptz);
```

Nunca guardar secrets OAuth en cliente. Solo `AUTH_*` server-side.

### 5.3 Config

```ts
// src/auth/config.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { CustomPostgresAdapter } from "./adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: CustomPostgresAdapter(),
  session: { strategy: "database" },
  providers: [
    GitHub({ allowDangerousEmailAccountLinking: false }),
    Google({ allowDangerousEmailAccountLinking: false }),
  ],
  callbacks: {
    async session({ session, user }) {
      // inyecta memberships: session.workspaceIds, session.roleByWorkspace
      return session;
    },
  },
});
```

```ts
// src/auth/guards.ts
export async function requireSession() { /* auth() o redirect(/sign-in) */ }
export async function requireMembership(wsSlug: string) { /* join memberships o notFound() */ }
```

```ts
// middleware.ts
export default auth((req) => {
  const isAuth = !!req.auth;
  const isApp = req.nextUrl.pathname.match(/^\/[^/]+(\/|$)/);
  if (isApp && !isAuth) return Response.redirect(new URL("/sign-in", req.url));
});
```

### 5.4 Variables

```text
AUTH_SECRET=<openssl rand -base64 32>
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
NEXTAUTH_URL=https://cursus.empovaro.com (prod) | http://localhost:3000 (dev)
```

### 5.5 Flujo UX

`/(marketing) → Sign in con GitHub / Sign in con Google → callback → / (selector workspace) → /:wsSlug/issues`. `sign-out` invalida `sessions` + limpia cookie.

---

## 6. Frontend Next.js (reglas)

- Default RSC. `page.tsx/layout.tsx/loading.tsx/error.tsx` siempre RSC async con `auth()` + queries + `<Suspense>`.
- Client solo: `Board (dnd-kit), List virtualizada, CommandPalette (cmdk), FiltersBar (nuqs), IssueEditor, PresenceAvatar`.
- Filtros en URL con `nuqs` (linkeables): `?status=&assignee=&project=&q=`.
- UI efímera en `zustand`: `sidebarOpen, paletteOpen, dndActiveId`. Nada de dominio en zustand.
- Validación doble: `schema.ts` zod importado por form cliente y re-parseado en Server Action.
- Accesibilidad AA: DnD con teclado, `grid/listbox` ARIA, foco visible, `Esc` cierra palette, `aria-activedescendant`.
- Estilo: Tailwind v4 + tokens propios + dark mode. Sin dependencias de juego/3D.

---

## 7. MCP

### 7.1 Dirección 1: Cursus como MCP server

```text
Claude / Opencode ──Streamable HTTP──▶ https://cursus.empovaro.com/api/mcp ──▶ Postgres
```

- Un solo `POST /api/mcp` stateless (`sessionIdGenerator: undefined`, `enableJsonResponse: true`). `runtime: nodejs`. SSE no usar (deprecated).
- Auth: `Bearer cur2_sk_... (sha256 en DB)` verificado antes de handler + scopes (`read`, `issues:write`, `issues:delete`) + filtro `workspaceId` en cada query.
- Guardrails: zod `.describe().strict()`, `limit≤50`, `confirmed:true` en destructivas, idempotencia `clientMutationId`, token bucket `60/min lectura, 20/min escritura, 5/min bulk`, `429+Retry-After`, tabla `mcp_audit`.
- Archivos: `src/app/api/mcp/route.ts`, `src/mcp/server.ts`, `tools/{issues,projects,search}.ts`, `auth.ts`, `ratelimit.ts`.

15 tools MVP (prefijo `cursus_`):

| # | Tool | Input | Output |
|---|---|---|---|
| 1 | `cursus_create_issue` | title 3-200, desc, projectId uuid, priority, labels, assignee | id, identifier, url |
| 2 | `cursus_list_issues` | projectId?, status?, limit≤50, cursor? | issues[], nextCursor |
| 3 | `cursus_get_issue` | id\|identifier | full |
| 4 | `cursus_update_status` | id, status enum | old, new |
| 5 | `cursus_update_issue` | id, title?, desc?, priority? | updatedFields |
| 6 | `cursus_add_comment` | issueId, body≤10k | commentId |
| 7 | `cursus_search` | query≥2, scope, limit≤25 | results[] |
| 8 | `cursus_create_project` | name, key [A-Z]{2,6} | id, key, url |
| 9 | `cursus_list_projects` | limit≤50 | projects[] |
| 10 | `cursus_create_label` | name, color hex | id |
| 11 | `cursus_assign_issue` | id, assignee\|null | id |
| 12 | `cursus_set_priority` | id, priority | id |
| 13 | `cursus_list_teams` | — | teams[] |
| 14 | `cursus_bulk_update_status` ⚠️ | ids≤20, status, confirmed:true | updated, failed |
| 15 | `cursus_delete_issue` ⚠️ | id, confirmed:true | deleted (soft) |

Resources: `cursus://projects/{id}`, `cursus://issues/{id}`. Prompts: `/triage`, `/plan-sprint`, `/spec-to-issues`.

### 7.2 Dirección 2: consumir MCP externos

Server Action interna → SDK client → MCP externo. `context7` para ayuda docs en editor. `playwright` solo CI/E2E, nunca desde browser usuario.

### 7.3 `opencode.jsonc` (copiar al repo nuevo)

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "context7": { "type": "remote", "url": "https://mcp.context7.com/mcp" },
      "playwright": { "type": "local", "command": ["bunx", "@playwright/mcp"] },
      "cursus-local": {
        "type": "remote",
        "url": "http://localhost:3000/api/mcp",
        "headers": { "Authorization": "Bearer ${CURSUS_MCP_TOKEN}" }
      },
      "cursus": {
        "type": "remote",
        "url": "https://cursus.empovaro.com/api/mcp",
        "headers": { "Authorization": "Bearer ${CURSUS_MCP_TOKEN}" }
      }
    }
  }
}
```

---

## 8. Deploy Dokploy — `cursus.empovaro.com`

```text
Traefik (:80/:443 LE)
 ├─ cursus.empovaro.com → web:3000 (Next standalone)
 ├─ db:5432 interno (no expuesto)
 └─ redis:6379 interno (no expuesto)
```

### 8.1 `next.config.ts` + `/api/health`

```ts
import type { NextConfig } from "next";
const cfg: NextConfig = { output: "standalone", experimental: { typedRoutes: true } };
export default cfg;
```

`GET /api/health` → `{status:"ok"}`. `GET /api/health?deep=1` → `SELECT 1 + redis ping` → `200 ok | 503 degraded`.

### 8.2 Dockerfile (raíz del repo nuevo)

```dockerfile
FROM oven/bun:1.4 AS deps
WORKDIR /app
COPY bun.lock package.json tsconfig.base.json ./
COPY package.json ./
RUN bun install --frozen-lockfile --ignore-scripts

FROM oven/bun:1.4 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:validate
RUN bun run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN apk add --no-cache curl && addgroup -S app && adduser -S app -G app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/db/migrations ./migrations
COPY --from=builder /app/docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh
USER app
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -fs http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
```

```sh
# docker-entrypoint.sh
#!/bin/sh
set -e
bun run db:validate
bun run db:migrate
node ./server.js
```

### 8.3 `docker-compose.yml` (paridad local)

```yaml
services:
  web:
    build: { context: . }
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://app:${POSTGRES_PASSWORD}@db:5432/app
      REDIS_URL: redis://redis:6379
      AUTH_SECRET: ${AUTH_SECRET}
      NEXTAUTH_URL: http://localhost:3000
    depends_on: { db: { condition: service_healthy }, redis: { condition: service_healthy } }
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_DB: app, POSTGRES_USER: app, POSTGRES_PASSWORD: ${POSTGRES_PASSWORD} }
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck: { test: ["CMD-SHELL","pg_isready -U app -d app"], interval: 10s, timeout: 3s, retries: 5 }
  redis:
    image: redis:7-alpine
    command: ["redis-server","--appendonly","yes","--maxmemory","256mb","--maxmemory-policy","allkeys-lru"]
    volumes: [redisdata:/data]
volumes: { pgdata: {}, redisdata: {} }
```

### 8.4 Env Dokploy

```text
DATABASE_URL=postgresql://app:<pw>@<host-dokploy>:5432/app
REDIS_URL=redis://:<pw>@<host-dokploy>:6379
AUTH_SECRET=<openssl rand -base64 32>
AUTH_GITHUB_ID=... / AUTH_GITHUB_SECRET=...
AUTH_GOOGLE_ID=... / AUTH_GOOGLE_SECRET=...
NEXTAUTH_URL=https://cursus.empovaro.com
NEXT_PUBLIC_APP_URL=https://cursus.empovaro.com
CURSUS_MCP_TOKEN=<solo server, nunca NEXT_PUBLIC>
# OBLIGATORIO en Dokploy: el puerto 3000 del host lo ocupa el propio
# Dokploy. Si WEB_PORT=3000 (o falta) el deploy falla con
# "Bind for 0.0.0.0:3000 failed: port is already allocated".
WEB_PORT=3010
GITHUB_APP_ID=... / GITHUB_APP_SLUG=...
GITHUB_APP_PRIVATE_KEY=<una línea con \n literales>
GITHUB_WEBHOOK_SECRET=<openssl rand -hex 32>
GITHUB_AUTO_CLOSE_ON_MERGE=true
```

### 8.5 Pasos Dokploy (click-a-click)

1. VPS Ubuntu 24.04, firewall `22,80,443` + SSH key. `curl -sSL https://dokploy.com/install.sh | sh` → admin en `http://<IP>:3000`.
2. Project `cursus` → Database Postgres `db` (user `app`/db `app`) + Redis `redis`. Guardar passwords.
3. App `web`: Source GitHub repo/rama `main`, Build `Dockerfile`, Env §8.4, Domains `cursus.empovaro.com:3000` HTTPS on, Healthcheck `/api/health` → Deploy.
4. DNS: `A cursus.empovaro.com → VPS-IP`, TTL 300.
5. Ver logs: `db:validate OK → migrate OK → listening 3000`.
6. Backup Postgres daily 02:00 UTC retención 7+4 a S3 + restore trimestral en staging.

VPS: **CX32 (4vCPU/8GB)** recomendado con previews. Mínimo CX22 sin previews.

### 8.6 Checklist post-deploy

```text
curl -fs https://cursus.empovaro.com/api/health → 200 ok
curl -fs .../api/health?deep=1 → 200 db+redis
/sign-in muestra GitHub + Google y loguea
/board drag mueve issue y persiste tras refresh
/opencode con cursus-local crea issue vía MCP
TLS LE válido, http→https redirect
Backup manual OK
```

---

## 9. Skills — catálogo, cuándo cargarlas y cómo

### 9.1 Tabla maestra

| Skill | Qué produce | Cuándo cargarla | Quién la usa |
|---|---|---|---|
| `nextjs-turbopack` | config dev/prod, FS caching, build verde | S0, S5 | scaffold, deploy |
| `vercel-react-best-practices` | RSC vs Client, fetching, bundle, optimistic | S0, S2, S3, S4 | todos frontend |
| `domain-modeling` | glosario + invariantes `CONTEXT.md` | S1 | DB/dominio |
| `hexagonal-architecture` | `domain/application/ports/adapters` por feature | S1 | DB/dominio |
| `tdd` | tests red-green `CreateIssue, MoveState, Assign` | S1, S2 | DB + board |
| `postgresql-optimization` | schema, enums, índices parciales, JSONB | S1 | DB |
| `sql-optimization` | paginación keyset, N+1 board | S1, S2 | DB + board |
| `api-documentation` | `openapi.yaml` + contrato MCP/tools | S1, S4 | DB + MCP |
| `security-review` | auth, tenant isolation, scopes MCP, rate-limit | S1, S4, S5 | DB + MCP + deploy |
| `frontend-design` | dirección visual densa estilo Linear | S2 | board/list |
| `high-end-visual-design` | tokens, spacing, dark mode | S2 | board/list |
| `accessibility` | DnD teclado, ARIA, foco, contraste | S2, S3 | board + palette |
| `webapp-testing` | E2E Playwright drag/filtros/teclado | S2, S3, S4, S5 | QA cada fase |
| `vercel-react-view-transitions` | transición palette open/close | S3 | palette |
| `deployment-engineer` | pipeline CI/CD, preview envs | S5 | deploy |
| `devops-deploy` | Docker, GH Actions, monitoreo | S5 | deploy |

**NO usar:** `gamedev/*, godot-*, threejs-*, phaser, pixijs, shader-programming, rpg/fps/platformer`, `canvas-design, algorithmic-art, brandkit` como core. Motivo: runtime 3D/física irrelevante para SaaS denso de teclado; penalizan bundle y TTI.

### 9.2 Cómo invocarlas (en cada prompt de subagente)

Cada subagente empieza su prompt con: `Carga las skills X, Y en este orden y usa solo sus conceptos. No uses skills de juego/3D.` Y termina con artefacto + `bun run` de verificación. Ver §10 para prompts listos.

---

## 10. División para subagentes en paralelo (cómo trabajar sin pisarse)

### 10.1 Topología (6 subagentes, 3 carriles)

```text
Carril A (base, secuencial):  S0 scaffold → S1 db+migraciones+auth-tablas
Carril B (frontend, tras S0): S2 board/list ─┐
Carril C (frontend, tras S0): S3 palette/shortcuts ─┴→ integración B+C (1 PR)
Carril D (plataforma, tras S1): S4 realtime+MCP
Carril E (tras S0, en paralelo todo el tiempo): S5 deploy/Docker/CI
```

- S0 no tiene dependencias. S1 depende de S0 (necesita `next.config + env + db/client`).
- S2 y S3 dependen solo de S0 (pueden correr en paralelo entre sí con mocks de `queries.ts`).
- S4 depende de S1 (necesita tablas + `guards.ts`).
- S5 solo necesita S0 (Dockerfile + compose + CI pueden hacerse con schema mock).
- Integración B+C: un solo PR que une `Board + Palette` (evita conflictos en `layout.tsx`).

### 10.2 Contratos anti-colisión (archivos por dueño)

| Subagente | Dueño de archivos (nadie más los toca) | Solo lee |
|---|---|---|
| S0 scaffold | `package.json, next.config.ts, tsconfig, middleware.ts, env.ts, src/app/(marketing)/*, src/app/api/health/*, biome, vitest/playwright configs, opencode.jsonc` | — |
| S1 db+auth | `src/db/**, src/auth/**, src/features/*/schema.ts, src/features/*/queries.ts` | S0 `env.ts, db/client.ts` |
| S2 board | `src/features/issues/_components/Board*, List*, IssueCard*, src/app/[wsSlug]/teams/**` | S1 `queries.ts/schema.ts` (mock si no existe) |
| S3 palette | `src/features/issues/_components/CommandPalette*, src/hooks/use-hotkeys.ts, src/ui/Kbd*` | S0 layout |
| S4 mcp | `src/app/api/mcp/**, src/mcp/**, src/realtime/**, src/app/api/realtime/**` | S1 `guards.ts, queries.ts` |
| S5 deploy | `Dockerfile, docker-entrypoint.sh, docker-compose.yml, .github/workflows/*, .env.example` | S0 `next.config` |

Regla: si necesitas tocar archivo de otro dueño → lo pides en el PR, no lo tocas directo.

### 10.3 Prompts listos para pegar (1 por subagente)

**S0 — Scaffold:**

```text
Carga skills: nextjs-turbopack, vercel-react-best-practices.
Repo: cursus (Next.js 16 App Router + Turbopack + TS estricto + Tailwind v4 + Biome).
Crea: package.json (bun, scripts dev/build/start/test/db:*), next.config.ts (standalone, typedRoutes),
tsconfig (strict+noUncheckedIndexedAccess+@/*), middleware.ts (placeholder auth),
env.ts (zod: DATABASE_URL, AUTH_SECRET, AUTH_GITHUB_*, AUTH_GOOGLE_*, NEXTAUTH_URL, REDIS_URL),
src/app/(marketing)/page.tsx, src/app/api/health/route.ts (?deep=1 placeholder),
biome.json, vitest.config.ts, playwright.config.ts, .env.example, opencode.jsonc (context7+playwright+cursus-local+cursus).
DoD: bun install && bun run dev (:3000) && bun run build verde.
No uses Drizzle, ni skills de juego/3D. Devuelve árbol + comandos corridos.
```

**S1 — DB + migraciones propias + OAuth base:**

```text
Carga skills en orden: domain-modeling, hexagonal-architecture, tdd, postgresql-optimization, sql-optimization, api-documentation, security-review.
Construye: src/db/client.ts (postgres.js singleton), src/db/migrate.ts + validate.ts según §4
(cabecera migration/name/author/date/description/requires + checksum + deny-list),
3 migraciones (init: users/accounts/sessions/workspaces/memberships; teams_projects: teams/projects/labels; issues: issues/history/comments),
src/db/types.ts + seeds.ts, src/auth/config.ts (GitHub+Google) + adapter.ts propio + guards.ts + roles.ts,
features/*/schema.ts (zod) + queries.ts (SQL parametrizado, sin next/*) + tests vitest (CreateIssue/MoveState/Assign).
DoD: bun run db:validate && bun run db:migrate && bun run test verdes + openapi.yaml mínimo.
Valida que cada .sql tenga author Nombre <email>. No uses Drizzle/Prisma.
```

**S2 — Board/List:**

```text
Carga skills: frontend-design, high-end-visual-design, vercel-react-best-practices, accessibility, webapp-testing.
Construye con mocks de queries.ts si S1 no terminó: [wsSlug]/layout (Sidebar-server) + teams/[teamId]/issues + board/ + list/
con Board-server (RSC) → Board-client (dnd-kit, useOptimistic) + List virtualizada + IssueCard + FiltersBar (nuqs ?status=&assignee=&project=&q=)
+ IssueDetail + EmptyState + tokens dark.
DoD: drag persiste (o mock), filtros linkeables, E2E playwright drag+filtros verde, a11y AA (teclado+ARIA+foco).
No toques palette/hooks ni mcp. Devuelve capturas + reporte a11y.
```

**S3 — Palette + Shortcuts:**

```text
Carga skills: vercel-react-best-practices, vercel-react-view-transitions, accessibility, webapp-testing.
Construye: CommandPalette (cmdk, lazy, debounce) + use-hotkeys (C/A/I/S/P/L/E/Shift+D/Cmd+K/Cmd+B/F/G+? ) + Kbd UI + focus-trap + aria-activedescendant + Esc.
DoD: todo operable solo teclado, E2E Cmd+K,C,G+I verde, transición open/close suave.
No toques Board ni mcp.
```

**S4 — Realtime + MCP:**

```text
Carga skills: api-documentation, security-review, vercel-react-best-practices, webapp-testing.
Construye: realtime scoped team:{id} (proveedor a elegir Supabase/Pusher, client.ts + server.ts broadcast + router.refresh),
POST /api/mcp stateless (runtime nodejs, Bearer cur2_sk_..., scopes, workspaceId filter, rate-limit token bucket, mcp_audit)
con tools 1-8 (create/get/list/update_status/update/search/create_project/list_projects) + resources + prompts base,
más clients.ts para context7. Registra cursus-local en opencode.jsonc.
DoD: 2 browsers ven drag <500ms (o degradado a refresh), opencode con CURSUS_MCP_TOKEN crea/lista issues, tests concurrencia verdes.
```

**S5 — Deploy:**

```text
Carga skills: deployment-engineer, devops-deploy, nextjs-turbopack, security-review.
Construye: Dockerfile multi-stage (§8.2) + docker-entrypoint.sh (validate+migrate+start) + docker-compose.yml (web/db/redis)
+ .dockerignore + .github/workflows/ci.yml (typecheck+db:validate+test+build+docker) + guía Dokploy §8.5 + .env.example completo OAuth+MCP.
DoD: docker build OK + compose up + /api/health y ?deep=1 200 + deploy en cursus.empovaro.com según checklist §8.6.
```

### 10.4 Agenda de ejecución (tiempo estimado 10-14 días)

| Día | Paralelo | Hito |
|---|---|---|
| 1 | S0 + S5 (arrancan juntos) | scaffold verde + Dockerfile borrador |
| 2-4 | S1 (bloquea) + S2/S3 con mocks | migraciones validadas + board/palette en mock |
| 5-6 | S2+S3 integración | PR B+C unido, E2E verde con DB real |
| 5-8 | S4 | realtime + MCP 1-8 contra DB real |
| 8-10 | S5 + hardening OAuth | prod `cursus.empovaro.com` + checklist |
| 10-14 | buffer QA + fixes | Lighthouse + a11y + rate-limit afinado |

---

## 11. Roadmap + Definición de terminado + comandos

### DoD global MVP

```text
[ ] bun run db:validate verde (todas las migraciones con autor válido)
[ ] bun run test verde (dominio + board ordering + guards)
[ ] bunx playwright test verde (board drag, filtros, palette teclado, sign-in OAuth mock)
[ ] /sign-in con GitHub + Google funciona en staging
[ ] board drag persiste tras refresh, 2 browsers <500ms o degradado documentado
[ ] opencode con cursus-local crea/lista/actualiza issues
[ ] https://cursus.empovaro.com/api/health y ?deep=1 200
[ ] Lighthouse perf/a11y ≥ 90 en board con 200 issues
```

### Comandos

```bash
bun install
bun run dev                  # http://localhost:3000
bun run build && bun run start
bun run db:validate
bun run db:migrate
bun run db:dry-run
bun run db:status
bun run test
bunx playwright test
curl -fs http://localhost:3000/api/health
curl -fs "http://localhost:3000/api/health?deep=1"
```

---

## 12. Riesgos y mitigaciones

1. Sin ORM → SQL a mano diverge de zod. Mitiga: `schema.ts` única fuente de entrada + tests + `db:validate` en CI.
2. Migración editada retroactivamente → checksum difiere. Mitiga: runner bloquea, exige migración correctiva nueva.
3. Falta `author` → deuda de auditoría. Mitiga: validador exige `Nombre <email>`, CI bloquea.
4. OAuth callback en prod falla → `NEXTAUTH_URL` mal. Mitiga: `env.ts` por entorno + checklist §8.6.
5. Realtime sin sticky → eventos perdidos. Mitiga: `router.refresh()` + `revalidateTag` como fuente de verdad, realtime solo optimización.
6. MCP expone tenant ajeno → filtra siempre por `workspaceId` + tests `security-review` con 2 workspaces.
7. Env filtrada al cliente → solo `NEXT_PUBLIC_*` en browser, `CURSUS_MCP_TOKEN` nunca con ese prefijo.

---

## Apéndice A — Ejemplo migración completa (copiar)

```sql
-- migration: 20261012080000
-- name: init
-- author: Tu Nombre <tu@delfostrading.com>
-- date: 2026-10-12
-- description: users, accounts OAuth, sessions, workspaces, memberships
-- requires: none

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email citext unique,
  image text,
  created_at timestamptz not null default now()
);

create table if not exists accounts (
  user_id uuid not null references users(id) on delete cascade,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at integer,
  primary key (user_id, provider)
);

create table if not exists sessions (
  session_token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  user_id uuid not null references users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','guest')),
  primary key (user_id, workspace_id)
);
```

## Apéndice B — `.env.example` (copiar)

```text
DATABASE_URL=postgresql://app:changeme@localhost:5432/app
REDIS_URL=redis://localhost:6379
AUTH_SECRET=changeme-openssl-rand-base64-32
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
CURSUS_MCP_TOKEN=
POSTGRES_PASSWORD=changeme
```

---

*Siguiente paso: pegar los prompts §10.3 en 6 conversaciones/subagentes en paralelo (S0+S5 primero), luego S1, luego S2+S3 con mocks, luego S4.*
