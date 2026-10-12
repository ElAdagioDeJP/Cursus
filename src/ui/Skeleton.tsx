import { cn } from "@/lib/cn";

/** Skeleton con la forma del destino final. Solo opacity, respeta reduced-motion. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("cursus-skeleton", className)} />
  );
}

export function BoardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando tablero"
      className="flex gap-3 overflow-hidden pb-4"
    >
      {[0, 1, 2, 3].map((c) => (
        <div key={c} className="w-72 shrink-0 p-2">
          <div className="flex items-center justify-between px-1.5 py-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-7 rounded-full" />
          </div>
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((r) => (
              <Skeleton key={r} className="h-[76px] w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">Cargando tablero…</span>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div role="status" aria-label="Cargando lista" className="flex flex-col">
      {[0, 1, 2, 3, 4].map((r) => (
        <div key={r} className="border-b border-cursus-border py-2">
          <Skeleton className="mb-2 h-3 w-24" />
          <Skeleton className="h-[68px] w-full rounded-lg" />
        </div>
      ))}
      <span className="sr-only">Cargando lista…</span>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando incidencia"
      className="mx-auto flex max-w-3xl flex-col gap-6"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-64" />
      </div>
      <Skeleton className="h-[92px] w-full rounded-lg" />
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <span className="sr-only">Cargando incidencia…</span>
    </div>
  );
}
