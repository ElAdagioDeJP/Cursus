/**
 * Cliente genérico Streamable HTTP JSON-RPC para consumir MCP externos
 * (context7, playwright, cursus) desde Server Actions (§7.2).
 * Sin nombres de métodos inventados: el llamador indica method/params.
 */
export interface JsonRpcClientOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export async function postJsonRpc<T = unknown>(
  url: string,
  method: string,
  params: Record<string, unknown>,
  opts: JsonRpcClientOptions = {},
): Promise<T> {
  const id = Math.floor(Math.random() * 1_000_000);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(opts.headers ?? {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
      signal: ctrl.signal,
    });
    if (res.status === 202) return undefined as T;
    if (!res.ok) throw new Error(`MCP externo ${res.status}.`);
    const data = (await res.json()) as {
      result?: T;
      error?: { message: string };
    };
    if (data.error) throw new Error(data.error.message);
    return data.result as T;
  } finally {
    clearTimeout(timer);
  }
}
