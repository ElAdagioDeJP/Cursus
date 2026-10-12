/** Crear incidencia (C enfoca el título). */
"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, GhostButton } from "@/ui/Button";
import { createIssueAction } from "../actions";

export function NewIssueForm({
  wsSlug,
  teamId,
  projects,
  labels,
}: {
  wsSlug: string;
  teamId: string;
  projects: Array<{ id: string; key: string; name: string }>;
  labels: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(3);
  const [projectId, setProjectId] = useState("");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await createIssueAction(wsSlug, {
          teamId,
          title,
          projectId: projectId || null,
          priority,
          labelIds,
        });
        setTitle("");
        setLabelIds([]);
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo crear.");
      }
    });
  };

  if (!open) {
    return (
      <GhostButton onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
        Nueva incidencia (C)
      </GhostButton>
    );
  }

  const inputCls =
    "rounded-md border border-cursus-border bg-cursus-surface px-3 py-2 text-sm text-cursus-text-1 placeholder:text-cursus-text-3";

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-lg border border-cursus-border bg-cursus-surface p-4"
      aria-label="Nueva incidencia"
    >
      <input
        id="cursus-new-issue-title"
        aria-label="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        minLength={3}
        maxLength={200}
        required
        placeholder="Título (mín. 3 caracteres)…"
        className={inputCls}
      />
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Prioridad"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
          className="rounded-md border border-cursus-border bg-cursus-surface px-2 py-1.5 text-sm text-cursus-text-1"
        >
          {[0, 1, 2, 3, 4].map((p) => (
            <option key={p} value={p}>
              P{p}
            </option>
          ))}
        </select>
        <select
          aria-label="Proyecto"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="rounded-md border border-cursus-border bg-cursus-surface px-2 py-1.5 text-sm text-cursus-text-1"
        >
          <option value="">Sin proyecto</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.key} · {p.name}
            </option>
          ))}
        </select>
      </div>
      {labels.length > 0 ? (
        <fieldset className="flex flex-wrap gap-1.5">
          <legend className="sr-only">Etiquetas</legend>
          {labels.map((l) => (
            <label
              key={l.id}
              className="flex cursor-pointer items-center gap-1 rounded-full border border-cursus-border px-2 py-0.5 text-xs text-cursus-text-2 has-checked:border-cursus-primary has-checked:bg-cursus-primary has-checked:text-cursus-on-primary"
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={labelIds.includes(l.id)}
                onChange={() =>
                  setLabelIds((v) =>
                    v.includes(l.id)
                      ? v.filter((x) => x !== l.id)
                      : [...v, l.id],
                  )
                }
              />
              {l.name}
            </label>
          ))}
        </fieldset>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-cursus-danger">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || title.trim().length < 3}>
          {pending ? "Creando…" : "Crear"}
        </Button>
        <GhostButton type="button" onClick={() => setOpen(false)}>
          Cancelar
        </GhostButton>
      </div>
    </form>
  );
}
