/** Avatar Linear 20px: inicial sobre pozo sutil, hairline, sin morados. */
export function Avatar({ name }: { name: string | null }) {
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      role="img"
      aria-label={name ?? "Sin asignar"}
      title={name ?? "Sin asignar"}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cursus-border bg-white/[0.03] font-mono text-[11px] font-medium text-cursus-text-2"
    >
      {initial}
    </span>
  );
}
