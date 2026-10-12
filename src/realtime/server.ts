/**
 * Broadcast realtime (S4): Redis pub/sub en `cursus:team:{id}`.
 * Degradado silencioso si no hay Redis: revalidateTag + router.refresh
 * son la fuente de verdad (§12.5).
 */
import Redis from "ioredis";

let pub: Redis | null | undefined;

function getPub(): Redis | null {
  if (pub !== undefined) return pub;
  const url = process.env.REDIS_URL;
  if (!url) {
    pub = null;
    return null;
  }
  pub = new Redis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  });
  pub.on("error", () => undefined);
  return pub;
}

export async function broadcast(channel: string, event: string): Promise<void> {
  const client = getPub();
  if (!client) return;
  try {
    if (client.status !== "ready") await client.connect();
    await client.publish(
      `cursus:${channel}`,
      JSON.stringify({ event, at: Date.now() }),
    );
  } catch {
    // Degradado: el refresh ya garantiza convergencia.
  }
}
