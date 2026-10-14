/**
 * Orquestación de eventos de GitHub → Cursus, estilo app de Linear:
 * PR abierto ⇒ issue a review; push en rama con identifier ⇒ in_progress;
 * merge ⇒ done. El vínculo issue↔PR vive en issue_github_links.
 * Sin imports de next/* (el route handler llama aquí).
 */
import { broadcast } from "@/realtime/server";
import { commentOnPullRequest } from "./lib/github-app";
import {
  closesIssue,
  extractBranchIdentifiers,
  extractIdentifiers,
} from "./lib/parse";
import {
  addSystemComment,
  ensureRepo,
  findIssueByIdentifier,
  markPrState,
  resolveWorkspaceByInstallation,
  resolveWorkspaceByRepo,
  transitionIssue,
  upsertPrLink,
} from "./queries";

export interface PullRequestEvent {
  action: string;
  installationId: number | null;
  repoId: number;
  repoFullName: string;
  prNumber: number;
  prUrl: string;
  prTitle: string;
  prBody: string;
  branch: string;
  baseBranch: string;
  merged: boolean;
  commitSha: string | null;
}

export interface PushEvent {
  installationId: number | null;
  repoId: number;
  repoFullName: string;
  branch: string;
  commitMessages: string[];
  commitSha: string | null;
}

interface ResolvedRepo {
  workspaceId: string;
  installationDbId: string;
  installationId: number | null;
}

async function resolveRepo(
  repoFullName: string,
  repoId: number,
  installationId: number | null,
): Promise<ResolvedRepo | null> {
  const byRepo = await resolveWorkspaceByRepo(repoFullName);
  if (byRepo) {
    await ensureRepo(
      byRepo.workspaceId,
      byRepo.installationDbId,
      repoId,
      repoFullName,
    );
    return byRepo;
  }
  // Repo aún no sincronizado: cae a la instalación del evento (auto-sync).
  if (installationId === null) return null;
  const byInst = await resolveWorkspaceByInstallation(installationId);
  if (!byInst) return null;
  await ensureRepo(
    byInst.workspaceId,
    byInst.installationDbId,
    repoId,
    repoFullName,
  );
  return { ...byInst, installationId };
}

function mentionsForPr(ev: PullRequestEvent) {
  const seen = new Map(
    [
      ...extractBranchIdentifiers(ev.branch),
      ...extractIdentifiers(`${ev.prTitle}\n${ev.prBody}`),
    ].map((m) => [m.identifier, m]),
  );
  return [...seen.values()];
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function handlePullRequest(
  ev: PullRequestEvent,
): Promise<{ linked: string[] }> {
  const repo = await resolveRepo(ev.repoFullName, ev.repoId, ev.installationId);
  if (!repo) return { linked: [] };
  const linked: string[] = [];
  const touchedTeams = new Set<string>();

  for (const mention of mentionsForPr(ev)) {
    const issue = await findIssueByIdentifier(
      repo.workspaceId,
      mention.teamKey,
      mention.number,
    );
    // Claves de team de otros workspaces u otros proyectos: se ignoran
    // (el teamKey solo es único dentro de su workspace).
    if (!issue) continue;

    if (ev.action === "closed") {
      const state = ev.merged ? "merged" : "closed";
      await upsertPrLink({
        workspaceId: repo.workspaceId,
        issueId: issue.id,
        repoFullName: ev.repoFullName,
        prNumber: ev.prNumber,
        prUrl: ev.prUrl,
        prTitle: ev.prTitle,
        state,
        branch: ev.branch,
        commitSha: ev.commitSha,
      });
      if (ev.merged) {
        const text = `${ev.prTitle}\n${ev.prBody}\n${ev.branch}`;
        const autoClose =
          (process.env.GITHUB_AUTO_CLOSE_ON_MERGE ?? "true") !== "false";
        if (autoClose || closesIssue(text, issue.identifier)) {
          const moved = await transitionIssue(
            issue.id,
            "done",
            `merge ${ev.repoFullName}#${ev.prNumber}`,
          );
          await addSystemComment(
            issue.id,
            `Cerrado por ${ev.repoFullName}#${ev.prNumber} (merge a ${ev.baseBranch}).`,
          );
          if (moved) touchedTeams.add(issue.team_id);
        }
      }
    } else {
      // opened, reopened, synchronize, edited, ready_for_review, …
      await upsertPrLink({
        workspaceId: repo.workspaceId,
        issueId: issue.id,
        repoFullName: ev.repoFullName,
        prNumber: ev.prNumber,
        prUrl: ev.prUrl,
        prTitle: ev.prTitle,
        state: "open",
        branch: ev.branch,
        commitSha: ev.commitSha,
      });
      const moved = await transitionIssue(
        issue.id,
        "review",
        `PR ${ev.repoFullName}#${ev.prNumber} abierto`,
      );
      if (moved) touchedTeams.add(issue.team_id);
    }
    linked.push(issue.identifier);
  }

  for (const teamId of touchedTeams) {
    await broadcast(`team:${teamId}`, "issues:changed");
  }

  // Comentario de vuelta en el PR solo al abrir, y solo si hay App configurada.
  if (
    ev.action === "opened" &&
    linked.length > 0 &&
    repo.installationId !== null
  ) {
    const list = linked.map((i) => `**${i}** (${appUrl()})`).join(", ");
    await commentOnPullRequest(
      repo.installationId,
      ev.repoFullName,
      ev.prNumber,
      `Vinculado con Cursus: ${list}. Al hacer merge el issue pasará a Done.`,
    );
  }
  return { linked };
}

export async function handlePush(ev: PushEvent): Promise<{ linked: string[] }> {
  if (ev.branch === "") return { linked: [] };
  const repo = await resolveRepo(ev.repoFullName, ev.repoId, ev.installationId);
  if (!repo) return { linked: [] };
  const mentions = new Map(
    [
      ...extractBranchIdentifiers(ev.branch),
      ...extractIdentifiers(ev.commitMessages.join("\n")),
    ].map((m) => [m.identifier, m]),
  );
  const linked: string[] = [];
  const touchedTeams = new Set<string>();
  for (const mention of mentions.values()) {
    const issue = await findIssueByIdentifier(
      repo.workspaceId,
      mention.teamKey,
      mention.number,
    );
    if (!issue) continue;
    const moved = await transitionIssue(
      issue.id,
      "in_progress",
      `push en ${ev.branch}`,
    );
    if (moved) touchedTeams.add(issue.team_id);
    linked.push(issue.identifier);
  }
  for (const teamId of touchedTeams) {
    await broadcast(`team:${teamId}`, "issues:changed");
  }
  return { linked };
}

/** Cierre/reapertura manual de un PR sin evento merged (sincroniza estados). */
export async function syncPrState(
  repoFullName: string,
  prNumber: number,
  state: "open" | "closed" | "merged",
): Promise<void> {
  const repo = await resolveWorkspaceByRepo(repoFullName);
  if (!repo) return;
  await markPrState(repo.workspaceId, repoFullName, prNumber, state);
}
