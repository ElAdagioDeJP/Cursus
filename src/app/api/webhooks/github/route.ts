/**
 * POST /api/webhooks/github — webhook de la GitHub App estilo Linear.
 * Verifica HMAC sha256 (x-hub-signature-256) con el cuerpo CRUDO y
 * despacha pull_request / push / installation. Siempre 200 tras verificar
 * (GitHub reintenta los 4xx/5xx); 401 solo con firma inválida.
 */
import { NextResponse } from "next/server";
import {
  handlePullRequest,
  handlePush,
  type PullRequestEvent,
  type PushEvent,
} from "@/features/github/handler";
import { verifySignature } from "@/features/github/lib/signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function branchFromRef(ref: unknown): string {
  const r = str(ref);
  return r.startsWith("refs/heads/") ? r.slice("refs/heads/".length) : r;
}

function toPullRequestEvent(
  payload: Record<string, unknown>,
): PullRequestEvent | null {
  const pr = payload.pull_request as Record<string, unknown> | undefined;
  const repo = payload.repository as Record<string, unknown> | undefined;
  const inst = payload.installation as { id?: unknown } | undefined;
  if (!pr || !repo) return null;
  const head = (pr.head as Record<string, unknown> | undefined) ?? {};
  const base = (pr.base as Record<string, unknown> | undefined) ?? {};
  const prNumber = num(pr.number ?? (payload as { number?: unknown }).number);
  if (!prNumber) return null;
  return {
    action: str(payload.action),
    installationId: typeof inst?.id === "number" ? (inst.id as number) : null,
    repoId: num(repo.id),
    repoFullName: str(repo.full_name),
    prNumber,
    prUrl: str(pr.html_url),
    prTitle: str(pr.title),
    prBody: str(pr.body),
    branch: str(head.ref),
    baseBranch: str(base.ref),
    merged: (pr.merged as boolean) === true,
    commitSha: typeof head.sha === "string" ? (head.sha as string) : null,
  };
}

function toPushEvent(payload: Record<string, unknown>): PushEvent | null {
  const repo = payload.repository as Record<string, unknown> | undefined;
  const inst = payload.installation as { id?: unknown } | undefined;
  if (!repo) return null;
  const commits = Array.isArray(payload.commits)
    ? (payload.commits as Array<{ message?: unknown; id?: unknown }>)
    : [];
  return {
    installationId: typeof inst?.id === "number" ? (inst.id as number) : null,
    repoId: num(repo.id),
    repoFullName: str(repo.full_name),
    branch: branchFromRef(payload.ref),
    commitMessages: commits.map((c) => str(c.message)),
    commitSha: str(payload.after) || null,
  };
}

export async function POST(req: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET ?? "";
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook de GitHub no configurado (GITHUB_WEBHOOK_SECRET)." },
      { status: 503 },
    );
  }
  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!verifySignature(secret, raw, signature)) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const event = req.headers.get("x-github-event") ?? "";
  try {
    if (event === "pull_request") {
      const ev = toPullRequestEvent(payload);
      if (!ev) return NextResponse.json({ ok: true, ignored: true });
      const { linked } = await handlePullRequest(ev);
      return NextResponse.json({ ok: true, linked });
    }
    if (event === "push") {
      const ev = toPushEvent(payload);
      if (!ev) return NextResponse.json({ ok: true, ignored: true });
      const { linked } = await handlePush(ev);
      return NextResponse.json({ ok: true, linked });
    }
    // installation, installation_repositories, ping: 200 sin más.
    return NextResponse.json({ ok: true, ignored: true });
  } catch (err) {
    console.error(
      `[github-webhook] ${event}: ${err instanceof Error ? err.message : err}`,
    );
    return NextResponse.json(
      { error: "Error interno procesando el evento." },
      { status: 500 },
    );
  }
}
