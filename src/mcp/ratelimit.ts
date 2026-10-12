/**
 * Rate-limit token bucket (§7.1): 60/min lectura, 20/min escritura, 5/min bulk.
 * Redis cuando hay REDIS_URL; memoria local como degradado (documentado).
 * Responde 429 + Retry-After.
 */
import Redis from "ioredis";

export type BucketKind = "read" | "write" | "bulk";
const LIMITS: Record<BucketKind, { max: number; windowSec: number }> = {
  read: { max: 60, windowSec: 60 },
  write: { max: 20, windowSec: 60 },
  bulk: { max: 5, windowSec: 60 },
};

export interface LimitResult {
  allowed: boolean;
  retryAfterSec: number;
}

let redis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.REDIS_URL;
  if (!url) {
    redis = null;
    return null;
  }
  redis = new Redis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  });
  redis.on("error", () => undefined);
  return redis;
}

// Degradado en memoria (una instancia; suficiente para MVP monoinstancia)
const memory = new Map<string, { count: number; resetAt: number }>();

export function memoryCheck(
  key: string,
  kind: BucketKind,
  now = Date.now(),
): LimitResult {
  const { max, windowSec } = LIMITS[kind];
  const slot = `${key}:${kind}:${Math.floor(now / 1000 / windowSec)}`;
  const cur = memory.get(slot);
  if (!cur) {
    memory.set(slot, {
      count: 1,
      resetAt: (Math.floor(now / 1000 / windowSec) + 1) * windowSec * 1000,
    });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (cur.count >= max) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)),
    };
  }
  cur.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export async function checkRateLimit(
  keyId: string,
  kind: BucketKind,
): Promise<LimitResult> {
  const client = getRedis();
  if (!client) return memoryCheck(`mcp:${keyId}`, kind);
  const { max, windowSec } = LIMITS[kind];
  const bucket = `mcp:rl:${keyId}:${kind}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  try {
    if (client.status !== "ready") await client.connect();
    const count = await client.incr(bucket);
    if (count === 1) await client.expire(bucket, windowSec);
    if (count > max) {
      const ttl = await client.ttl(bucket);
      return { allowed: false, retryAfterSec: Math.max(1, ttl) };
    }
    return { allowed: true, retryAfterSec: 0 };
  } catch {
    return memoryCheck(`mcp:${keyId}`, kind);
  }
}
