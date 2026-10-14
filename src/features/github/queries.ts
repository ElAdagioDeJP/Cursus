/**
 * queries.ts — SOLO SQL + tipos. Sin imports de next/* (contrato §3).
 * Toda query filtra por workspaceId (aislamiento de tenant).
 */
import { first, getSql } from "@/db/client";
import type {
  GithubInstallationRow,
  GithubRepoRow,
  IssueGithubLinkRow,
} from "@/db/types";
import type { LinkState } from "./schema";

export interface GithubIssueRef {
  id: string;
  team_id: string;
  team_key: string;
  number: number;
  status: string;
  identifier: string;
}

/** Workspace dueño de un repo (vía tabla sincronizada o instalación). */
export async function resolveWorkspaceByRepo(fullName: string): Promise<{
  workspaceId: string;
  installationDbId: string;
  installationId: number;
} | null> {
  const sql = getSql();
  const rows = await sql`select r.workspace_id, r.installation_id,
      i.installation_id as gh_installation_id
    from github_repos r
    join github_installations i on i.id = r.installation_id
    where lower(r.full_name) = lower(${fullName})`;
  const r = first(
    rows as unknown as Array<{
      workspace_id: string;
      installation_id: string;
      gh_installation_id: number;
    }>,
  );
  if (!r) return null;
  return {
    workspaceId: String(r.workspace_id),
    installationDbId: String(r.installation_id),
    installationId: Number(r.gh_installation_id),
  };
}

export async function resolveWorkspaceByInstallation(
  installationId: number,
): Promise<{ workspaceId: string; installationDbId: string } | null> {
  const sql = getSql();
  const rows = await sql`select id, workspace_id from github_installations
    where installation_id = ${installationId}`;
  const r = first(
    rows as unknown as Array<{ id: string; workspace_id: string }>,
  );
  if (!r) return null;
  return {
    workspaceId: String(r.workspace_id),
    installationDbId: String(r.id),
  };
}

/** Registra el repo al primer evento (auto-sync, como la app de Linear). */
export async function ensureRepo(
  workspaceId: string,
  installationDbId: string,
  repoId: number,
  fullName: string,
): Promise<void> {
  const sql = getSql();
  await sql`insert into github_repos (workspace_id, installation_id, repo_id, full_name)
    values (${workspaceId}, ${installationDbId}, ${repoId}, ${fullName})
    on conflict (workspace_id, repo_id) do update set full_name = excluded.full_name`;
}

export async function findIssueByIdentifier(
  workspaceId: string,
  teamKey: string,
  number: number,
): Promise<GithubIssueRef | null> {
  const sql = getSql();
  const rows =
    await sql`select i.id, i.team_id, i.status, t.key as team_key, i.number
    from issues i join teams t on t.id = i.team_id
    where t.workspace_id = ${workspaceId} and t.key = ${teamKey} and i.number = ${number}`;
  const r = first(
    rows as unknown as Array<{
      id: string;
      team_id: string;
      team_key: string;
      status: string;
      number: number;
    }>,
  );
  if (!r) return null;
  return {
    id: String(r.id),
    team_id: String(r.team_id),
    team_key: String(r.team_key),
    number: Number(r.number),
    status: String(r.status),
    identifier: `${r.team_key}-${r.number}`,
  };
}

export interface UpsertLinkInput {
  workspaceId: string;
  issueId: string;
  repoFullName: string;
  prNumber: number;
  prUrl: string;
  prTitle: string;
  state: LinkState;
  branch: string;
  commitSha: string | null;
}

export async function upsertPrLink(input: UpsertLinkInput): Promise<void> {
  const sql = getSql();
  await sql`insert into issue_github_links
      (workspace_id, issue_id, repo_full_name, pr_number, pr_url, pr_title, state, branch, commit_sha)
    values (${input.workspaceId}, ${input.issueId}, ${input.repoFullName},
      ${input.prNumber}, ${input.prUrl}, ${input.prTitle}, ${input.state},
      ${input.branch}, ${input.commitSha})
    on conflict (issue_id, repo_full_name, pr_number) do update set
      pr_url = excluded.pr_url, pr_title = excluded.pr_title,
      state = excluded.state, branch = excluded.branch,
      commit_sha = excluded.commit_sha, updated_at = now()`;
}

export async function markPrState(
  workspaceId: string,
  repoFullName: string,
  prNumber: number,
  state: LinkState,
): Promise<string[]> {
  const sql = getSql();
  const rows =
    await sql`update issue_github_links set state = ${state}, updated_at = now()
    where workspace_id = ${workspaceId} and lower(repo_full_name) = lower(${repoFullName})
      and pr_number = ${prNumber} returning issue_id`;
  return rows.map((r) => String((r as { issue_id: string }).issue_id));
}

/** Transición de estado con actor de sistema (actor_id NULL) + historial. */
export async function transitionIssue(
  issueId: string,
  toStatus: "in_progress" | "review" | "done",
  historyDetail: string,
): Promise<boolean> {
  const sql = getSql();
  return sql.begin(async (tx) => {
    const rows =
      (await tx`select status, team_id from issues where id = ${issueId} for update`) as Array<{
        status: string;
        team_id: string;
      }>;
    const row = first(rows);
    if (!row || row.status === toStatus || row.status === "canceled")
      return false;
    if (toStatus === "in_progress" && !["backlog", "todo"].includes(row.status))
      return false;
    if (
      toStatus === "review" &&
      !["backlog", "todo", "in_progress"].includes(row.status)
    )
      return false;
    if (toStatus === "done" && row.status === "done") return false;
    await tx`update issues set status = ${toStatus} where id = ${issueId}`;
    await tx`insert into issue_history (issue_id, actor_id, field, old_value, new_value)
      values (${issueId}, null, 'github', ${row.status}, ${toStatus})`;
    void historyDetail;
    return true;
  });
}

export async function addSystemComment(
  issueId: string,
  body: string,
): Promise<void> {
  const sql = getSql();
  await sql`insert into comments (issue_id, author_id, body)
    values (${issueId}, null, ${body})`;
}

export async function listIssueLinks(
  workspaceId: string,
  issueId: string,
): Promise<IssueGithubLinkRow[]> {
  const sql = getSql();
  const rows = await sql`select * from issue_github_links
    where workspace_id = ${workspaceId} and issue_id = ${issueId}
    order by created_at desc`;
  return rows as unknown as IssueGithubLinkRow[];
}

export async function connectInstallation(
  workspaceId: string,
  installationId: number,
  accountLogin: string,
  accountType: "Organization" | "User",
  userId: string | null,
): Promise<GithubInstallationRow> {
  const sql = getSql();
  const rows = await sql`insert into github_installations
      (workspace_id, installation_id, account_login, account_type, created_by)
    values (${workspaceId}, ${installationId}, ${accountLogin}, ${accountType}, ${userId})
    on conflict (workspace_id, installation_id) do update set
      account_login = excluded.account_login, updated_at = now()
    returning *`;
  return first(
    rows as unknown as GithubInstallationRow[],
  ) as GithubInstallationRow;
}

export async function disconnectInstallation(
  workspaceId: string,
  installationId: number,
): Promise<void> {
  const sql = getSql();
  await sql`delete from github_installations
    where workspace_id = ${workspaceId} and installation_id = ${installationId}`;
}

export async function listInstallations(
  workspaceId: string,
): Promise<GithubInstallationRow[]> {
  const sql = getSql();
  const rows = await sql`select * from github_installations
    where workspace_id = ${workspaceId} order by created_at`;
  return rows as unknown as GithubInstallationRow[];
}

export async function listRepos(workspaceId: string): Promise<GithubRepoRow[]> {
  const sql = getSql();
  const rows = await sql`select * from github_repos
    where workspace_id = ${workspaceId} order by full_name`;
  return rows as unknown as GithubRepoRow[];
}
