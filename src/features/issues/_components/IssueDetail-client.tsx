/** Detalle de incidencia: acciones rápidas con atajos + comentarios + historial. */
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { teamBoard } from "@/lib/routes";
import { Avatar } from "@/ui/Avatar";
import { PriorityMark, StatusBadge } from "@/ui/Badge";
import { Button, GhostButton } from "@/ui/Button";
import {
  addCommentAction,
  assignIssueAction,
  deleteIssueAction,
  moveIssueAction,
  setPriorityAction,
  updateIssueAction,
} from "../actions";

const STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
  "canceled",
] as const;
const ESTIMATES = [1, 2, 3, 5, 8, 13, 21] as const;

interface DetailIssue {
  id: string;
  identifier: string;
  title: string;
  description: string;
  status: (typeof STATUSES)[number];
  priority: number;
  estimate_points: number | null;
  assignee_id: string | null;
  assignee_name?: string | null;
  due_date: string | null;
  sort_key: string;
  labels: Array<{ id: string; name: string; color: string }>;
  comments: Array<{
    id: string;
    body: string;
    author_name?: string | null;
    created_at: string;
  }>;
  history: Array<{
    id: string;
    field: string;
    old_value: string | null;
    new_value: string | null;
    created_at: string;
  }>;
}

const inputCls =
  "rounded-md border border-cursus-border bg-cursus-surface px-2 py-1.5 text-sm text-cursus-text-1";

export function IssueDetail({
  wsSlug,
  teamId,
  userId,
  issue,
}: {
  wsSlug: string;
  teamId: string;
  userId: string;
  issue: DetailIssue;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comment, setComment] = useState("");

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  useHotkeys([
    {
      combo: "a",
      handler: () =>
        run(() =>
          assignIssueAction(wsSlug, { id: issue.id, assigneeId: userId }),
        ),
    },
    {
      combo: "i",
      handler: () =>
        run(() =>
          assignIssueAction(wsSlug, { id: issue.id, assigneeId: userId }),
        ),
    },
    {
      combo: "s",
      handler: () => document.getElementById("cursus-detail-status")?.focus(),
    },
    {
      combo: "p",
      handler: () => document.getElementById("cursus-detail-priority")?.focus(),
    },
    {
      combo: "e",
      handler: () => document.getElementById("cursus-detail-estimate")?.focus(),
    },
    {
      combo: "shift+d",
      handler: () => document.getElementById("cursus-detail-due")?.focus(),
    },
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm text-cursus-text-2">
          {issue.identifier}
        </span>
        <h1 className="font-display text-xl font-semibold text-cursus-text-1">
          {issue.title}
        </h1>
        <StatusBadge status={issue.status} />
      </header>

      <fieldset className="grid grid-cols-2 gap-3 rounded-lg border border-cursus-border p-4 sm:grid-cols-4">
        <legend className="sr-only">Acciones rápidas</legend>
        <label className="flex flex-col gap-1 text-xs text-cursus-text-2">
          Estado (S)
          <select
            id="cursus-detail-status"
            value={issue.status}
            disabled={pending}
            onChange={(e) =>
              run(() =>
                moveIssueAction(wsSlug, {
                  id: issue.id,
                  toStatus: e.target.value,
                  toSortKey: issue.sort_key,
                }),
              )
            }
            className={inputCls}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-cursus-text-2">
          Prioridad (P)
          <select
            id="cursus-detail-priority"
            value={issue.priority}
            disabled={pending}
            onChange={(e) =>
              run(() =>
                setPriorityAction(wsSlug, {
                  id: issue.id,
                  priority: Number(e.target.value),
                }),
              )
            }
            className={inputCls}
          >
            {[0, 1, 2, 3, 4].map((p) => (
              <option key={p} value={p}>
                P{p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-cursus-text-2">
          Estimación (E)
          <select
            id="cursus-detail-estimate"
            value={issue.estimate_points ?? ""}
            disabled={pending}
            onChange={(e) =>
              run(() =>
                updateIssueAction(wsSlug, {
                  id: issue.id,
                  estimatePoints:
                    e.target.value === "" ? null : Number(e.target.value),
                }),
              )
            }
            className={inputCls}
          >
            <option value="">—</option>
            {ESTIMATES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-cursus-text-2">
          Vence (Shift+D)
          <input
            id="cursus-detail-due"
            type="date"
            defaultValue={issue.due_date ?? ""}
            disabled={pending}
            onBlur={(e) => {
              if (e.target.value !== (issue.due_date ?? "")) {
                run(() =>
                  updateIssueAction(wsSlug, {
                    id: issue.id,
                    dueDate: e.target.value || null,
                  }),
                );
              }
            }}
            className={inputCls}
          />
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center gap-2 text-sm text-cursus-text-1">
        <Avatar name={issue.assignee_name ?? null} />
        <span className="text-cursus-text-2">
          {issue.assignee_name ?? "Sin asignar"}
        </span>
        <GhostButton
          disabled={pending}
          onClick={() =>
            run(() =>
              assignIssueAction(wsSlug, { id: issue.id, assigneeId: userId }),
            )
          }
        >
          Asignarme (I)
        </GhostButton>
        {issue.assignee_id ? (
          <GhostButton
            disabled={pending}
            onClick={() =>
              run(() =>
                assignIssueAction(wsSlug, { id: issue.id, assigneeId: null }),
              )
            }
          >
            Liberar
          </GhostButton>
        ) : null}
        <span className="ml-auto">
          <PriorityMark priority={issue.priority} />
        </span>
      </div>

      {issue.description ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-cursus-text-1">
          {issue.description}
        </p>
      ) : (
        <p className="text-sm text-cursus-text-3">Sin descripción.</p>
      )}

      {issue.labels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          <span className="sr-only">Etiquetas: </span>
          {issue.labels.map((l) => (
            <span
              key={l.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-cursus-surface-2 px-2.5 py-1 text-xs text-cursus-text-2"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: l.color }}
                aria-hidden="true"
              />
              {l.name}
            </span>
          ))}
        </div>
      ) : null}

      <section aria-label="Comentarios">
        <h2 className="mb-2 font-display font-semibold text-cursus-text-1">
          Comentarios ({issue.comments.length})
        </h2>
        {issue.comments.length === 0 ? (
          <p className="text-sm text-cursus-text-3">
            Sin comentarios todavía. Escribe el primero.
          </p>
        ) : null}
        <ul className="flex flex-col gap-2">
          {issue.comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-cursus-border bg-cursus-surface p-3 text-sm text-cursus-text-1"
            >
              <p className="mb-1 text-xs text-cursus-text-3">
                {c.author_name ?? "Anónimo"}
              </p>
              <p className="whitespace-pre-wrap">{c.body}</p>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const body = comment.trim();
            if (!body) return;
            setComment("");
            run(() => addCommentAction(wsSlug, { issueId: issue.id, body }));
          }}
        >
          <input
            aria-label="Añadir comentario"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={10000}
            placeholder="Escribe un comentario…"
            className="flex-1 rounded-md border border-cursus-border bg-cursus-surface px-3 py-2 text-sm text-cursus-text-1 placeholder:text-cursus-text-3"
          />
          <Button type="submit" disabled={pending || !comment.trim()}>
            Comentar
          </Button>
        </form>
      </section>

      {issue.history.length > 0 ? (
        <section aria-label="Historial">
          <h2 className="mb-2 font-display font-semibold text-cursus-text-1">
            Historial
          </h2>
          <ul className="flex flex-col gap-1 font-mono text-xs text-cursus-text-3">
            {issue.history.slice(0, 10).map((h) => (
              <li key={h.id}>
                <span>{h.field}</span>: {h.old_value || "—"} →{" "}
                {h.new_value || "—"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div>
        <GhostButton
          disabled={pending}
          onClick={() => {
            if (
              !window.confirm(
                `Archivar ${issue.identifier}? Pasará a Cancelado.`,
              )
            )
              return;
            startTransition(async () => {
              await deleteIssueAction(wsSlug, issue.id, true);
              router.push(teamBoard(wsSlug, teamId));
            });
          }}
        >
          Archivar incidencia
        </GhostButton>
      </div>
    </div>
  );
}
