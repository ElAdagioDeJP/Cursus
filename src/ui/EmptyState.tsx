import { cn } from "@/lib/cn";

/* Empty-state Linear: minimalista, sin caja punteada. Pozo de icono
   40px con borde white/8, título 14px blanco, hint 13px gris-3.
   API intacta (title, hint, action, icon) + className opcional. */
export function EmptyState({
  title,
  hint,
  action,
  icon,
  className,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-md border border-cursus-border bg-white/[0.02] text-cursus-text-3"
        >
          {icon}
        </span>
      ) : null}
      <p className="text-sm font-semibold text-cursus-text-1">{title}</p>
      {hint ? (
        <p className="max-w-sm text-[13px] leading-relaxed text-cursus-text-3">
          {hint}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
