# CONTEXT.md — Glosario Cursus (lenguaje ubicuo)

> Solo glosario. Sin detalles de implementación. Si el código contradice un término, el glosario manda y el código se corrige.

## Términos

| Término (ES UI) | Term (code) | Significado |
|---|---|---|
| Espacio de trabajo | `Workspace` | Raíz de tenencia. Todo pertenece a un workspace. Se direcciona por `slug`. |
| Equipo | `Team` | Pertenece a 1 workspace. Tiene `key` única por workspace (ej `CUR`). Los issues siempre pertenecen a 1 team. |
| Proyecto | `Project` | Pertenece a 1 workspace, abarca 1..n teams. Tiene `key` `[A-Z]{2,6}` única por workspace. |
| Incidencia | `Issue` | Unidad de trabajo. Pertenece a 1 team (obligatorio) y 0..1 proyecto. `identifier = TEAMKEY-number` (ej `CUR-123`). |
| Número | `number` | Contador por team. Cambia de team ⇒ cambia el `identifier`. Nunca se reutiliza. |
| Estado | `WorkflowState` | `Backlog → Todo → In Progress → In Review → Done (+Canceled)`. MVP sin estados custom. |
| Prioridad | `priority` | `0=None, 1=Urgent, 2=High, 3=Medium, 4=Low`. Sin customs en MVP. |
| Estimación | `estimate` | T-shirt: `XS=1, S=2, M=3, L=5, XL=8, XXL=13, XXXL=21` puntos. Opcional. |
| Etiqueta | `Label` | Pertenece al workspace. Color hex. Relación m:n con issues. |
| Comentario | `Comment` | Pertenece a 1 issue. Máx 10.000 caracteres. |
| Historial | `History` | Registro append-only de cambios `(field, old, new, actor)`. |
| Sub-incidencia | `SubIssue` | Issue con `parent`. Máx 10 niveles. Puede ser de otro team. |
| Miembro | `Membership` | `(user, workspace, role)`. Roles: `Owner | Admin | Member | Guest`. |
| Vista | `View` | Filtros guardados (post-MVP). En MVP los filtros viven en la URL. |
| Clave API | `ApiKey` | `cur2_sk_…` (solo hash en DB). Scopes: `read`, `issues:write`, `issues:delete`. Por workspace. |

## Invariantes (reglas que nunca se rompen)

1. `Issue.teamId` obligatorio; 1 team por issue.
2. `identifier` deriva de `(team.key, number)`; mover de team cambia el identifier.
3. `priority ∈ {0,1,2,3,4}`; `status ∈ {backlog,todo,in_progress,review,done,canceled}`.
4. `dueDate XOR SLA`: en MVP no hay SLA, así que `dueDate` vive solo.
5. `title` 3–200 caracteres; `comment.body` 1–10.000.
6. MCP destructivo exige `confirmed:true`; lectura `limit≤50`.
7. Toda mutación verifica `membership` del workspace antes de escribir.
8. Textos UI en español; código e identificadores en inglés.
