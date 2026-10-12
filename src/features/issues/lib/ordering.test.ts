import { describe, expect, it } from "vitest";
import { initialKey, keyBetween } from "./ordering";

describe("keyBetween", () => {
  it("primera clave válida", () => {
    expect(initialKey()).toMatch(/^\d{10}$/);
  });
  it("punto medio exacto", () => {
    expect(keyBetween("0000001000", "0000002000")).toBe("0000001500");
  });
  it("anexar crece y anteponer decrece", () => {
    const a = initialKey();
    const b = keyBetween(a, null);
    const c = keyBetween(b, null);
    const p = keyBetween(null, a);
    expect(a < b && b < c && p < a).toBe(true);
  });
  it("40 inserciones al inicio mantienen orden estricto", () => {
    let head: string | null = null;
    const first = initialKey();
    for (let i = 0; i < 40; i++) {
      const k = keyBetween(null, head ?? first);
      expect(k < (head ?? first)).toBe(true);
      expect(k).toMatch(/^\d{10}(\.\d+)?$/);
      head = k;
    }
  });
  it("200 anexados mantienen orden estricto", () => {
    let tail = initialKey();
    for (let i = 0; i < 200; i++) {
      const k = keyBetween(tail, null);
      expect(k > tail).toBe(true);
      tail = k;
    }
  });
  it("lanza si a >= b", () => {
    expect(() => keyBetween("0000002000", "0000001000")).toThrow();
    expect(() => keyBetween("0000001000", "0000001000")).toThrow();
  });
});
