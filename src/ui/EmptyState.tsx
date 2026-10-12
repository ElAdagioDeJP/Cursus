/** Empty-state contenido (VARIANCE 6): isotipo opcional + CTA, sin spinners. */
export function EmptyState({
  title,
  hint,
  action,
  icon,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-cursus-border bg-transparent px-6 py-16 text-center">
      {icon ? (
        <span aria-hidden="true" className="text-cursus-text-3">
          {icon}
        </span>
      ) : null}
      <p className="font-display text-[15px] font-semibold text-cursus-text-1">
        {title}
      </p>
      {hint ? (
        <p className="max-w-sm text-[13px] leading-relaxed text-cursus-text-3">
          {hint}
        </p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
