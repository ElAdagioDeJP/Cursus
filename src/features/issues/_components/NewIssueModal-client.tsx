/** Modal Nueva incidencia (Linear): título, descripción, estado, prioridad,
 *  asignado, proyecto y etiquetas. Cierre optimista: no espera al servidor;
 *  la fila aparece al instante vía evento provisional + refresh. */
"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { IssueListRow } from "@/db/types";
import { STATUS_LABEL } from "@/ui/Badge";
import { Button, GhostButton } from "@/ui/Button";
import { createIssueAction, moveIssueAction } from "../actions";
import { initialKey } from "../lib/ordering";
import type { WorkflowStatus } from "../schema";
import { emitProvisionalIssue } from "./List-client";

const STATUSES: WorkflowStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
  "canceled",
];

export function NewIssueModal({
  wsSlug,
  teamId,
  projects,
  labels,
  members,
}: {
  wsSlug: string;
  teamId: string;
  projects: Array<{ id: string; key: string; name: string }>;
  labels: Array<{ id: string; name: string; color: string }>;
  members: Array<{ id: string; name: string | null }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<WorkflowStatus>("backlog");
  const [priority, setPriority] = useState(3);
  const [assigneeId, setAssigneeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setStatus("backlog");
    setPriority(3);
    setAssigneeId("");
    setProjectId("");
    setLabelIds([]);
    setError("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = title.trim();
    const assigneeName = members.find((m) => m.id === assigneeId)?.name ?? null;
    const labelNames = labels
      .filter((l) => labelIds.includes(l.id))
      .map((l) => l.name);
    setOpen(false);
    startTransition(async () => {
      try {
        const res = await createIssueAction(wsSlug, {
          teamId,
          title: trimmed,
          description,
          priority,
          assigneeId: assigneeId || null,
          projectId: projectId || null,
          labelIds,
        });
        if (status !== "backlog") {
          await moveIssueAction(wsSlug, {
            id: res.id,
            toStatus: status,
            toSortKey: initialKey(),
          });
        }
        const now = new Date().toISOString();
        emitProvisionalIssue({
          id: res.id,
          team_id: teamId,
          project_id: projectId || null,
          parent_id: null,
          title: trimmed,
          description,
          status,
          priority,
          estimate_points: null,
          assignee_id: assigneeId || null,
          due_date: null,
          number: 0,
          sort_key: "",
          created_by: null,
          created_at: now,
          updated_at: now,
          team_key: "",
          identifier: res.identifier,
          assignee_name: assigneeName,
          project_key: null,
          label_names: labelNames,
        } satisfies IssueListRow);
        reset();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo crear.");
        setOpen(true);
      }
    });
  };

  if (!open) {
    return (
      <GhostButton
        id="cursus-new-issue-open"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
        Nueva incidencia (C)
      </GhostButton>
    );
  }

  const inputCls =
    "rounded-md border border-cursus-border bg-cursus-surface px-3 py-2 text-sm text-cursus-text-1 placeholder:text-cursus-text-3";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[12vh]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nueva incidencia"
        className="cursus-palette-panel w-full max-w-lg rounded-lg border border-cursus-border bg-cursus-surface p-5"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display font-semibold text-cursus-text-1">
            Nueva incidencia
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            className="cursus-pressable rounded-md px-2 py-1 text-cursus-text-3 hover:bg-cursus-surface-2 hover:text-cursus-text-1"
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-2.5">
          <input
            id="cursus-new-issue-title"
            ref={titleRef}
            aria-label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={3}
            maxLength={200}
            required
            placeholder="Título (mín. 3 caracteres)…"
            className={inputCls}
          />
          <textarea
            aria-label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Descripción…"
            className={inputCls}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-cursus-text-2">
              Estado
              <select
                aria-label="Estado"
                value={status}
                onChange={(e) => setStatus(e.target.value as WorkflowStatus)}
                className="rounded-md border border-cursus-border bg-cursus-surface px-2 py-1.5 text-sm text-cursus-text-1"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-cursus-text-2">
              Prioridad
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
            </label>
            <label className="flex flex-col gap-1 text-xs text-cursus-text-2">
              Asignado
              <select
                aria-label="Asignado"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="rounded-md border border-cursus-border bg-cursus-surface px-2 py-1.5 text-sm text-cursus-text-1"
              >
                <option value="">Sin asignar</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? "Sin nombre"}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-cursus-text-2">
              Proyecto
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
            </label>
          </div>
          {labels.length > 0 ? (
            <fieldset className="flex flex-wrap gap-1.5">
              <legend className="sr-only">Etiquetas</legend>
              {labels.map((l) => (
                <label
                  key={l.id}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-cursus-border px-2.5 py-1 text-xs text-cursus-text-2 has-checked:border-cursus-primary has-checked:bg-cursus-primary has-checked:text-cursus-on-primary"
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
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: l.color }}
                    aria-hidden="true"
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
      </div>
    </div>
  );
}
