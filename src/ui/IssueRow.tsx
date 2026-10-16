import { cn } from "@/lib/cn";

/* Fila de issue estilo Linear: identificador gris + título blanco +
   pills a la derecha. Presentacional: los frentes pasan slots,
   aquí no hay lógica de negocio ni navegación.
   - `href`: renderiza <a>; sin href renderiza <div>.
   - `selected`: fondo activo puntual (una fila por vista). */

export function IssueRow({
  identifier,
  title,
  pills,
  avatar,
  trailing,
  href,
  selected = false,
  className,
}: {
  identifier: string;
  title: string;
  pills?: React.ReactNode;
  avatar?: React.ReactNode;
  trailing?: React.ReactNode;
  href?: string;
  selected?: boolean;
  className?: string;
}) {
  const classes = cn(
    "group flex h-11 w-full items-center gap-3 border-b border-cursus-border px-3 text-left",
    "transition-colors duration-100",
    selected ? "bg-cursus-active" : "hover:bg-cursus-hover",
    "focus-visible:outline-2 focus-visible:outline-cursus-primary",
    className,
  );
  const content = (
    <>
      <span className="cursus-identifier w-16 shrink-0">{identifier}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-cursus-text-1">
        {title}
      </span>
      {pills ? (
        <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
          {pills}
        </span>
      ) : null}
      {avatar ? <span className="shrink-0">{avatar}</span> : null}
      {trailing ? (
        <span className="shrink-0 text-cursus-text-3">{trailing}</span>
      ) : null}
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        aria-current={selected ? "true" : undefined}
        className={classes}
      >
        {content}
      </a>
    );
  }
  return <div className={classes}>{content}</div>;
}
