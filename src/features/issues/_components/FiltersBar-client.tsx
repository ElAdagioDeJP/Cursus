/** Barra de filtros linkeable (nuqs). */
"use client";

import { useQueryStates } from "nuqs";
import { STATUS_LABEL } from "@/ui/Badge";
import { filterParsers } from "./filters";

const STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
  "canceled",
] as const;

export function FiltersBar({
  projects,
}: {
  projects: Array<{ id: string; key: string; name: string }>;
}) {
  const [filters, setFilters] = useQueryStates(filterParsers, {
    history: "replace",
  });

  const toggleStatus = (s: string) => {
    const next = filters.status.includes(s as (typeof STATUSES)[number])
      ? filters.status.filter((x) => x !== s)
      : [...filters.status, s as (typeof STATUSES)[number]];
    void setFilters({ status: next });
  };

  const inputCls =
    "rounded-md border border-cursus-border bg-cursus-surface px-2 py-1 text-[13px] text-cursus-text-1 placeholder:text-cursus-text-3";

  return (
    <search
      className="flex flex-wrap items-center gap-2"
      aria-label="Filtros de incidencias"
    >
      <fieldset className="flex flex-wrap gap-1">
        <legend className="sr-only">Estado</legend>
        {STATUSES.map((s) => {
          const pressed = filters.status.includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={pressed}
              onClick={() => toggleStatus(s)}
              className={
                pressed
                  ? "cursus-pressable rounded-full border border-cursus-primary bg-cursus-primary px-2.5 py-1 text-xs font-medium text-cursus-on-primary"
                  : "cursus-pressable rounded-full border border-cursus-border bg-transparent px-2.5 py-1 text-xs text-cursus-text-2 hover:bg-cursus-surface-2 hover:text-cursus-text-1"
              }
            >
              {STATUS_LABEL[s]}
            </button>
          );
        })}
      </fieldset>
      <select
        aria-label="Proyecto"
        value={filters.project}
        onChange={(e) => void setFilters({ project: e.target.value })}
        className={inputCls}
      >
        <option value="">Todos los proyectos</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.key} · {p.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Asignado"
        value={filters.assignee}
        onChange={(e) => void setFilters({ assignee: e.target.value })}
        className={inputCls}
      >
        <option value="">Cualquiera</option>
        <option value="me">Asignadas a mí</option>
        <option value="none">Sin asignar</option>
      </select>
      <input
        id="cursus-filter-q"
        type="search"
        aria-label="Buscar"
        placeholder="Buscar… (F)"
        value={filters.q}
        onChange={(e) =>
          void setFilters({ q: e.target.value }, { throttleMs: 300 })
        }
        className={`min-w-40 flex-1 ${inputCls}`}
      />
      {filters.status.length > 0 ||
      filters.assignee ||
      filters.project ||
      filters.q ? (
        <button
          type="button"
          onClick={() =>
            void setFilters({ status: [], assignee: "", project: "", q: "" })
          }
          className="cursus-pressable rounded-md px-2 py-1 text-[13px] text-cursus-text-3 underline-offset-2 hover:text-cursus-text-1 hover:underline"
        >
          Limpiar
        </button>
      ) : null}
    </search>
  );
}
