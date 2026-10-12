import { cn } from "@/lib/cn";

/* Botones: Señal Naranja como único acento. Contraste AA auditado:
   light: #fff sobre #c2410c = 5.9:1; dark: #140903 sobre #ff6b2c = 7.1:1.
   Press 120ms + scale(0.97), solo transform+opacity, curva marca. */

export function Button({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "cursus-pressable inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-cursus-primary px-4 py-2 font-mono text-[13px] font-medium text-cursus-on-primary hover:bg-cursus-primary-hover active:bg-cursus-primary-active disabled:cursor-not-allowed disabled:opacity-50",
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
        "cursus-pressable inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-cursus-border bg-transparent px-4 py-2 text-[13px] font-medium text-cursus-text-1 hover:bg-cursus-surface-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
