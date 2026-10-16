/** Cliente del Agent (paridad Linear Ask + Skills + historial). */
"use client";

import { useState } from "react";
import { Button } from "@/ui/Button";

export const AGENT_SKILLS = [
  { id: "cursus_search", label: "Buscar issues" },
  { id: "triage", label: "Triage del backlog" },
  { id: "plan-sprint", label: "Planificar sprint" },
  { id: "spec-to-issues", label: "Spec → issues" },
] as const;

/** Historial mock (8 entradas; base para persistir post-MVP). */
export const AGENT_HISTORY_MOCK: string[] = [
  "Identificar quién creó más issues",
  "Connect tasks to GitHub PRs",
  "Check quota",
  "Resumir el backlog del equipo",
  "Planificar el sprint actual",
  "Buscar issues sobre el login",
  "Listar proyectos del workspace",
  "Convertir una spec en issues",
];

export function AgentClient({ wsSlug }: { wsSlug: string }) {
  const [ask, setAsk] = useState("");
  const [skill, setSkill] = useState<string>(AGENT_SKILLS[0]?.id ?? "");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSearch() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "cursus_search",
            arguments: { query: ask.trim(), limit: 10 },
          },
        }),
      });
      const data = (await res.json()) as {
        result?: { content?: Array<{ text?: string }> };
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(
          res.status === 401
            ? "Sin autorización: pega una API key (cur2_sk_…) para llamar a /api/mcp."
            : (data.error?.message ?? `Error HTTP ${res.status}.`),
        );
        return;
      }
      if (data.error) {
        setError(data.error.message ?? "Error del servidor MCP.");
        return;
      }
      setResult(data.result?.content?.[0]?.text ?? "Sin resultados.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red.");
    } finally {
      setLoading(false);
    }
  }

  const skillHint =
    skill === "cursus_search"
      ? "Busca full-text en el workspace (tope 25)."
      : skill === "triage"
        ? "Clasifica el backlog: estado, prioridad y asignado."
        : skill === "plan-sprint"
          ? "Propone un plan semanal con las abiertas priorizadas."
          : "Convierte una especificación en incidencias creables.";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-cursus-text-3">
          Agent · {wsSlug}
        </p>
        <h1 className="mt-1 font-display text-xl font-semibold text-cursus-text-1">
          Pregunta al workspace
        </h1>
      </div>

      <form
        className="flex flex-col gap-2 rounded-lg border border-cursus-border bg-cursus-surface p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (ask.trim().length >= 2 && !loading) void runSearch();
        }}
      >
        <label
          htmlFor="agent-ask"
          className="text-[13px] font-medium text-cursus-text-2"
        >
          Ask
        </label>
        <input
          id="agent-ask"
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          minLength={2}
          maxLength={200}
          placeholder="p. ej. issues sobre el login"
          className="rounded-md border border-cursus-border bg-cursus-surface px-3 py-2 text-sm text-cursus-text-1 placeholder:text-cursus-text-3"
        />
        <label
          htmlFor="agent-skill"
          className="mt-1 text-[13px] font-medium text-cursus-text-2"
        >
          Skill
        </label>
        <select
          id="agent-skill"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className="rounded-md border border-cursus-border bg-cursus-surface px-3 py-2 text-sm text-cursus-text-1"
        >
          {AGENT_SKILLS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-cursus-text-3">{skillHint}</p>
        <label
          htmlFor="agent-key"
          className="mt-1 text-[13px] font-medium text-cursus-text-2"
        >
          API key (solo para /api/mcp)
        </label>
        <input
          id="agent-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="cur2_sk_…"
          autoComplete="off"
          className="rounded-md border border-cursus-border bg-cursus-surface px-3 py-2 font-mono text-sm text-cursus-text-1 placeholder:text-cursus-text-3"
        />
        <div className="mt-1">
          <Button type="submit" disabled={loading || ask.trim().length < 2}>
            {loading ? "Buscando…" : "Preguntar (cursus_search)"}
          </Button>
        </div>
      </form>

      {error ? (
        <p role="alert" className="text-sm text-prio-1">
          {error}
        </p>
      ) : null}
      {result ? (
        <pre className="overflow-auto rounded-lg border border-cursus-border bg-cursus-surface p-3 font-mono text-xs text-cursus-text-1">
          {result}
        </pre>
      ) : null}

      <section aria-label="Historial">
        <h2 className="font-display font-medium text-cursus-text-1">
          Historial
        </h2>
        <ul className="mt-2 flex flex-col gap-2">
          {AGENT_HISTORY_MOCK.map((h) => (
            <li
              key={h}
              className="rounded-md border border-cursus-border bg-cursus-surface px-3 py-2 text-sm text-cursus-text-2"
            >
              {h}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
