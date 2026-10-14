# GitHub App de Cursus (estilo Linear) — issues ↔ PRs

Conecta `TEAMKEY-number` (ej `CUR-123`) con los PRs de GitHub, como hace la
app de Linear:

| Evento en GitHub | Efecto en Cursus |
|---|---|
| PR abierto con `CUR-123` en rama, título o cuerpo | vínculo issue↔PR + issue a **review** + comentario en el PR |
| Push en rama con `CUR-123` | issue a **in_progress** (si estaba en backlog/todo) |
| PR con `Fixes CUR-123` o merge (según `GITHUB_AUTO_CLOSE_ON_MERGE`) | issue a **done** + comentario de sistema |
| PR cerrado sin merge | vínculo marcado `closed`, sin cambio de estado |

El estado del vínculo vive en `issue_github_links` y se consulta con
`listIssueLinks(workspaceId, issueId)`.

## 1. Crear la App (10 min, una sola vez)

> OJO: esta GitHub App **no** es el OAuth de login (`AUTH_GITHUB_ID`).
> Son dos apps distintas: una autentica usuarios, la otra vincula issues↔PRs.

1. GitHub → tu avatar → **Settings** → **Developer settings** →
   **GitHub Apps** → **New GitHub App**.
2. Rellena:
   - **GitHub App name**: `cursus-<tu-org>` (ej `cursus-empovaro`).
   - **Homepage URL**: `https://cursus.empovaro.com`
   - **Callback URL**: vacío (no se usa OAuth de usuario).
   - **Webhook**: ✅ Active —
     **Webhook URL**: `https://cursus.empovaro.com/api/webhooks/github`
     **Webhook secret**: genera con `openssl rand -hex 32` y guárdalo como
     `GITHUB_WEBHOOK_SECRET` en Dokploy.
   - **Permissions** (mínimas):
     - Repository → **Pull requests**: Read-only
     - Repository → **Contents**: Read-only (leer ramas/commits del push)
     - Repository → **Issues**: Read-only
       (los comentarios del PR van por la API de issues)
     - Repository → **Metadata**: Read-only (obligatorio)
     - Organization → **Members**: Read-only (opcional, para mapear assignees)
   - **Events** (suscribir): ✅ Pull request, ✅ Push, ✅ Installation,
     ✅ Installation repositories.
   - **Where can this app be installed?**: `Only on this account`
     (o tu org).
3. **Create GitHub App** → anota el **App ID** (`GITHUB_APP_ID`).
4. Abajo, **Private keys** → **Generate a private key** → guarda el `.pem`.
   En Dokploy va en UNA línea en `GITHUB_APP_PRIVATE_KEY`:
   ```bash
   awk 'NF {sub(/\r/, ""); printf "%s\\n", $0;}' clave-privada.pem
   ```
5. Arriba, **Install App** → instálala en tu usuario/org y anota el
   **Installation ID** (sale en la URL: `/settings/installations/<id>`).

## 2. Variables en Dokploy (prod `cursus.empovaro.com`)

```text
GITHUB_APP_ID=<número del paso 3>
GITHUB_APP_SLUG=<slug de la App, para el enlace de instalación>
GITHUB_APP_PRIVATE_KEY=<una línea con \n literales, paso 4>
GITHUB_WEBHOOK_SECRET=<hex del paso 2>
GITHUB_AUTO_CLOSE_ON_MERGE=true
```

Sin `GITHUB_APP_PRIVATE_KEY` todo funciona **menos** el comentario de vuelta
en el PR (best-effort). Sin `GITHUB_WEBHOOK_SECRET` el webhook responde 503.

## 3. Conectar workspace ↔ instalación

Opción A — SQL directo (una vez por workspace):

```sql
insert into github_installations (workspace_id, installation_id, account_login, account_type)
values ('<workspace-uuid>', <installation-id>, '<org-o-usuario>', 'Organization');
```

Opción B — Server Actions (solo admin): `connectGithubAction(wsSlug, …)` /
`disconnectGithubAction(wsSlug, installationId)` en
`src/features/github/actions.ts`. Los repos se auto-registran en
`github_repos` al llegar el primer evento (no hay que listarlos a mano).

## 4. Cómo referenciar issues (convención del equipo)

- Rama: `cur-123-login-roto` o `feature/CUR-123-x` (insensible a mayús).
- PR: `[CUR-123] título` y/o cuerpo con `Fixes CUR-123`.
- Cierre explícito: `Fixes|Closes|Resolves CUR-123` (cierra aunque
  `GITHUB_AUTO_CLOSE_ON_MERGE=false`).
- Varios issues por PR: se vinculan todos (se listan en `issue_github_links`).

## 5. Verificar

```bash
curl -X POST https://cursus.empovaro.com/api/webhooks/github \
  -H "X-GitHub-Event: ping" -H "x-hub-signature-256: sha256=…" -d '{}'
# 401 = firma mala (bien); 200 ping = verifica y responde ok/ignored.

# Tras abrir un PR con CUR-123:
#   issue en review + fila en issue_github_links con state='open'
# Tras merge:
#   issue en done + comentario "Cerrado por org/repo#N".
```

## 6. Límites conocidos (MVP)

- El `teamKey` solo es único **dentro de su workspace**: menciones de otros
  workspaces se ignoran (el repo pertenece a un solo workspace).
- Sin mapeo usuario GitHub ↔ usuario Cursus (el historial guarda
  `actor_id NULL` = sistema). Post-MVP: ligar por email.
- Sin UI de ajustes todavía: conexión por SQL o Server Action; la lista de
  PRs de un issue sale de `listIssueLinks` (pendiente de pintar en el detalle).
- Rate-limit de GitHub API: los comentarios son 1 llamada por PR abierto;
  el resto del flujo es solo DB local.
