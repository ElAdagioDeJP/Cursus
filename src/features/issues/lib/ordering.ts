/**
 * Claves de orden fraccionarias puras (lexorank simplificado decimal).
 * Formato: entero zero-padded a 10 + fracción decimal opcional.
 * Exacto con BigInt: midpoints encadenados nunca pierden precisión (hasta 12 decimales).
 */
const WIDTH = 10;
export const SORT_KEY_RE = /^\d{10}(\.\d+)?$/;

function scaled(value: string, decimals: number): bigint {
  const [ip = "0", fp = ""] = value.split(".");
  return BigInt(ip + (fp + "0".repeat(decimals)).slice(0, decimals));
}

function format(scaledValue: bigint, decimals: number): string {
  const base = 10n ** BigInt(decimals);
  const ip = (scaledValue / base).toString().padStart(WIDTH, "0");
  if (decimals === 0) return ip;
  const fp = (scaledValue % base)
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return fp ? `${ip}.${fp}` : ip;
}

/** Clave estrictamente entre a y b (null = extremo). Lanza si a >= b. */
export function keyBetween(a: string | null, b: string | null): string {
  if (a !== null && b !== null && a >= b) {
    throw new Error(`Clave inválida: ${a} debe ser menor que ${b}.`);
  }
  if (a !== null && !SORT_KEY_RE.test(a))
    throw new Error(`sort_key inválido: ${a}.`);
  if (b !== null && !SORT_KEY_RE.test(b))
    throw new Error(`sort_key inválido: ${b}.`);
  let decimals = Math.max(
    a?.split(".")[1]?.length ?? 0,
    b?.split(".")[1]?.length ?? 0,
  );
  for (;;) {
    const scale = 10n ** BigInt(decimals);
    const lo = a ? scaled(a, decimals) : 0n;
    const hi = b ? scaled(b, decimals) : lo + 2n * scale;
    const mid = (lo + hi) / 2n;
    if (mid > lo && (b ? mid < hi : true)) return format(mid, decimals);
    decimals += 1;
    if (decimals > 12)
      throw new Error("Sin espacio entre claves; reequilibrar columna.");
  }
}

/** Primera clave de una columna vacía. */
export function initialKey(): string {
  return format(1024n, 0);
}
