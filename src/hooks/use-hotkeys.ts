/** Atajos de teclado (§1.3). Puro el matching → testeable sin DOM. */
"use client";

import { useEffect, useRef } from "react";

export interface HotkeyDef {
  combo: string;
  handler: () => void;
}

interface Parsed {
  meta: boolean;
  shift: boolean;
  key: string;
}

export function parseCombo(combo: string): Parsed {
  const parts = combo.toLowerCase().split("+");
  const key = parts[parts.length - 1] as string;
  return {
    meta: parts.includes("cmd") || parts.includes("ctrl"),
    shift: parts.includes("shift"),
    key,
  };
}

export function comboMatches(e: KeyboardEvent, combo: string): boolean {
  const p = parseCombo(combo);
  const meta = e.metaKey || e.ctrlKey;
  if (p.meta !== meta) return false;
  if (p.shift !== e.shiftKey) return false;
  return e.key.toLowerCase() === p.key;
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof (el as HTMLElement).tagName !== "string") return false;
  const tag = (el as HTMLElement).tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (el as HTMLElement).isContentEditable
  );
}

/**
 * Secuencias tipo "g i": primer golpe arma, segundo dispara (ventana 800ms).
 * Enfoca con `sequence: "g"` + `key: "i"`.
 */
export function useHotkeys(
  hotkeys: Array<HotkeyDef & { sequence?: string }>,
  opts?: { enabled?: boolean },
) {
  const defsRef = useRef(hotkeys);
  defsRef.current = hotkeys;
  useEffect(() => {
    if (opts?.enabled === false) return;
    let pending: string | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onKey = (e: KeyboardEvent) => {
      const typing = isTyping(e.target);
      for (const h of defsRef.current) {
        if (h.sequence) {
          if (
            pending === h.sequence &&
            e.key.toLowerCase() === h.combo &&
            !typing
          ) {
            pending = null;
            clearTimeout(timer);
            e.preventDefault();
            h.handler();
            return;
          }
          continue;
        }
        if (h.combo === "escape") {
          if (comboMatches(e, "escape")) {
            h.handler();
            return;
          }
          continue;
        }
        if (
          typing &&
          !h.combo.startsWith("cmd+") &&
          !h.combo.startsWith("ctrl+") &&
          h.combo !== "escape"
        )
          continue;
        if (comboMatches(e, h.combo)) {
          // Armar secuencia g+b/i/l
          if (h.combo === "g" && !typing) {
            pending = "g";
            clearTimeout(timer);
            timer = setTimeout(() => (pending = null), 800);
            return;
          }
          e.preventDefault();
          h.handler();
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.enabled]);
}
