/**
 * Singleton postgres.js (§4). globalThis en dev para no agotar el pool con HMR.
 * Sin imports de next/*. Queries puras encima de este cliente.
 */

import type { Sql } from "postgres";
import postgres from "postgres";

const globalForDb = globalThis as unknown as { __cursusSql?: Sql };

function real(): Sql {
  if (!globalForDb.__cursusSql) {
    const url = process.env.DATABASE_URL;
    if (!url)
      throw new Error(
        "DATABASE_URL no configurado. Revisa .env / .env.example.",
      );
    globalForDb.__cursusSql = postgres(url, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return globalForDb.__cursusSql;
}

/**
 * Cliente perezoso: importar el módulo nunca lanza (el build de Docker
 * no tiene env por diseño — los secretos no van en la imagen).
 * El error solo aparece al ejecutar la primera query sin DATABASE_URL.
 */
export function getSql(): Sql {
  const dummy = () => {};
  return new Proxy(dummy, {
    get: (_t, prop) => {
      if (prop === "then") return undefined;
      const instance = real() as unknown as Record<string | symbol, unknown>;
      const value = instance[prop];
      return typeof value === "function"
        ? (value as (...a: unknown[]) => unknown).bind(instance)
        : value;
    },
    apply: (_t, _thisArg, args) => {
      const instance = real() as unknown as (...a: unknown[]) => unknown;
      return Reflect.apply(instance, instance, args);
    },
  }) as unknown as Sql;
}

/** Primera fila o lanza (para noUncheckedIndexedAccess sin aserciones dispersas). */
export function one<T>(rows: T[], what = "registro"): T {
  const row = rows[0];
  if (row === undefined) throw new Error(`${what} no encontrado.`);
  return row;
}

/** Primera fila o undefined (para búsquedas que devuelven null). */
export function first<T>(rows: T[]): T | undefined {
  return rows[0];
}
