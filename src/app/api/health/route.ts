import Redis from "ioredis";
import { NextResponse } from "next/server";
import { getSql } from "@/db/client";

/**
 * GET /api/health — §8.1
 * Shallow: {status:"ok"}. ?deep=1: SELECT 1 + redis ping → 200 ok | 503 degraded.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("deep") === null) {
    return NextResponse.json({ status: "ok" });
  }

  const checks: Record<string, string> = {};
  let ok = true;

  try {
    await getSql()`select 1`;
    checks.db = "ok";
  } catch {
    checks.db = "error";
    ok = false;
  }

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const client = new Redis(redisUrl, {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
      });
      client.on("error", () => undefined);
      await client.connect();
      const pong = await client.ping();
      checks.redis = pong === "PONG" ? "ok" : "error";
      if (checks.redis !== "ok") ok = false;
      client.disconnect();
    } catch {
      checks.redis = "error";
      ok = false;
    }
  } else {
    checks.redis = "sin-configurar";
    ok = false;
  }

  return NextResponse.json(
    { status: ok ? "ok" : "degraded", ...checks },
    { status: ok ? 200 : 503 },
  );
}
