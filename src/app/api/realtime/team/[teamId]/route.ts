/**
 * GET /api/realtime/team/[teamId] — SSE scoped al equipo.
 * Auth por cookie + membership; sin Redis responde 204 (degradado a refresh).
 */
import Redis from "ioredis";
import { auth } from "@/auth/config";
import { getSql } from "@/db/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const session = await auth();
  const userId = session?.user?.id as string | undefined;
  if (!userId) return new Response("No autorizado.", { status: 401 });

  const sql = getSql();
  const rows = await sql`select 1 from teams t
    join memberships m on m.workspace_id = t.workspace_id
    where t.id = ${teamId} and m.user_id = ${userId}`;
  if (rows.length === 0) return new Response("No encontrado.", { status: 404 });

  const url = process.env.REDIS_URL;
  if (!url) return new Response(null, { status: 204 });

  const sub = new Redis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  });
  sub.on("error", () => undefined);
  const channel = `cursus:team:${teamId}`;
  try {
    if (sub.status !== "ready") await sub.connect();
    await sub.subscribe(channel);
  } catch {
    sub.disconnect();
    return new Response(null, { status: 204 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (data: string) => {
        try {
          controller.enqueue(enc.encode(`data: ${data}\n\n`));
        } catch {
          // cliente cerrado
        }
      };
      send(JSON.stringify({ event: "hello" }));
      sub.on("message", (_ch, message) => send(message));
      const beat = setInterval(
        () => send(JSON.stringify({ event: "ping" })),
        25000,
      );
      (controller as unknown as { cleanup?: () => void }).cleanup = () => {
        clearInterval(beat);
        void sub
          .unsubscribe(channel)
          .catch(() => undefined)
          .finally(() => sub.disconnect());
      };
    },
    cancel() {
      void sub
        .unsubscribe(channel)
        .catch(() => undefined)
        .finally(() => sub.disconnect());
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
