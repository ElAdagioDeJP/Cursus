/**
 * Instrumentation placeholder (S0).
 * S4 registra aquí observabilidad realtime/MCP si hace falta.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Sin init pesado en MVP — env se valida lazy en imports.
  }
}
