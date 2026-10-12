/** Suscripción SSE por equipo: al recibir evento, router.refresh(). */
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function RealtimeRefresh({ teamId }: { teamId: string }) {
  const router = useRouter();
  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    const es = new EventSource(`/api/realtime/team/${teamId}`);
    es.onmessage = () => router.refresh();
    es.onerror = () => es.close();
    return () => es.close();
  }, [teamId, router]);
  return null;
}
