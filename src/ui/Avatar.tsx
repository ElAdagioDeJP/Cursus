/** Avatar 1 tinta: inicial sobre surface-2, hairline, sin morados. */
export function Avatar({ name }: { name: string | null }) {
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      role="img"
      aria-label={name ?? "Sin asignar"}
      title={name ?? "Sin asignar"}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cursus-border bg-cursus-surface-2 font-mono text-xs font-medium text-cursus-text-2"
    >
      {initial}
    </span>
  );
}
