import { cn } from "@/lib/cn";

/* Botones Linear-grade: 32px, sans 13px medium, radio 6px.
   REGLA DE ACENTO ÚNICO: `Button` (Señal Naranja) solo para la acción
   principal de la vista (New issue / Crear). Todo lo demás usa
   `GhostButton` (gris silencioso). Contraste AA auditado:
   light #fff/#c2410c = 5.9:1; dark #140903/#ff6b2c = 7.1:1. */

export function Button({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "cursus-pressable inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md bg-cursus-primary px-3 py-1.5 text-[13px] font-medium text-cursus-on-primary hover:bg-cursus-primary-hover active:bg-cursus-primary-active disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function GhostButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "cursus-pressable inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-md border border-cursus-border bg-transparent px-3 py-1.5 text-[13px] font-medium text-cursus-text-2 hover:bg-cursus-hover hover:text-cursus-text-1 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
