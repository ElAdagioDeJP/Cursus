import { cn } from "@/lib/cn";

/* Pill Linear:rounded-full, borde white/8, texto gris-2 12px mono.
   El acento Señal SOLO con `tone="accent"` (una vez por vista). */

type PillTone = "default" | "accent";

export function Pill({
  children,
  dotClassName,
  tone = "default",
  title,
  className,
}: {
  children: React.ReactNode;
  dotClassName?: string;
  tone?: PillTone;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full border px-2 py-px font-mono text-xs font-medium whitespace-nowrap",
        tone === "accent"
          ? "border-cursus-primary/40 bg-cursus-primary-soft text-cursus-primary"
          : "border-cursus-border bg-white/[0.02] text-cursus-text-2",
        className,
      )}
    >
      {dotClassName ? (
        <span
          aria-hidden="true"
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClassName)}
        />
      ) : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
