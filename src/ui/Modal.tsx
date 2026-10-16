"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";

/* Modal "New issue" estilo Linear: overlay negro 60% + blur, panel
   centrado max-w-lg, superficie #101014, borde white/8, footer con
   hairline superior. Presentacional: sin formularios dentro. */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[10vh]"
    >
      <button
        type="button"
        aria-label="Cerrar diálogo"
        onClick={onClose}
        className="cursus-overlay fixed inset-0 cursor-default"
      />
      <div
        className={cn(
          "cursus-modal-panel relative w-full max-w-lg rounded-lg border border-cursus-border bg-cursus-surface shadow-2xl shadow-black/50",
          className,
        )}
      >
        {title || onClose ? (
          <div className="flex h-12 items-center justify-between gap-3 border-b border-cursus-border px-4">
            <h2 className="truncate text-[13px] font-semibold text-cursus-text-1">
              {title}
            </h2>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="cursus-pressable inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-cursus-text-3 hover:bg-cursus-hover hover:text-cursus-text-1"
              >
                <X size={15} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="px-4 py-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-cursus-border px-4 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
