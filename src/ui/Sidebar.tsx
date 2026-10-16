import { cn } from "@/lib/cn";

/* Sidebar Linear: angosta (240px), fondo #0a0a0c, texto gris-2 13px,
   item activo con fondo white/6 + texto blanco. Solo primitivas:
   el enrutado y los datos los ponen los frentes. */

export function SidebarShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-cursus-border bg-cursus-sidebar px-3 py-4",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarSection({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("flex flex-col gap-0.5", className)}>
      {label ? <p className="cursus-section-label px-2 pb-1">{label}</p> : null}
      {children}
    </nav>
  );
}

export function SidebarItem({
  children,
  icon,
  badge,
  active = false,
  href,
  onClick,
  className,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const classes = cn(
    "cursus-pressable flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-[13px] font-medium",
    active
      ? "bg-cursus-active text-cursus-text-1"
      : "text-cursus-text-2 hover:bg-cursus-hover hover:text-cursus-text-1",
    "focus-visible:outline-2 focus-visible:outline-cursus-primary",
    className,
  );
  const content = (
    <>
      {icon ? (
        <span
          aria-hidden="true"
          className={cn(
            "shrink-0",
            active ? "text-cursus-text-1" : "text-cursus-text-3",
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {badge ? <span className="shrink-0">{badge}</span> : null}
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        aria-current={active ? "page" : undefined}
        className={classes}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={classes}
    >
      {content}
    </button>
  );
}
