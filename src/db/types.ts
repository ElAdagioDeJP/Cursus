/**
 * Tipos manuales del schema (§4.6). Sin generar. Fuente de tipos de lectura;
 * la entrada se valida con el schema.ts (zod) de cada feature.
 */

export type Role = "owner" | "admin" | "member" | "guest";
export type WorkflowStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "review"
  | "done"
  | "canceled";

export interface UserRow {
  id: string;
  name: string | null;
  email: string;
  email_verified: string | null;
  image: string | null;
  created_at: string;
}

export interface WorkspaceRow {
  id: string;
  slug: string;
  name: string;
  created_at: string;
}

export interface MembershipRow {
  user_id: string;
  workspace_id: string;
  role: Role;
}

export interface TeamRow {
  id: string;
  workspace_id: string;
  name: string;
  key: string;
  next_issue_number: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectRow {
  id: string;
  workspace_id: string;
  name: string;
  key: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface LabelRow {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface IssueRow {
  id: string;
  team_id: string;
  project_id: string | null;
  parent_id: string | null;
  title: string;
  description: string;
  status: WorkflowStatus;
  priority: number;
  estimate_points: number | null;
  assignee_id: string | null;
  due_date: string | null;
  number: number;
  sort_key: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueListRow extends IssueRow {
  team_key: string;
  identifier: string;
  assignee_name: string | null;
  project_key: string | null;
  label_names: string[];
}

export interface CommentRow {
  id: string;
  issue_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface HistoryRow {
  id: string;
  issue_id: string;
  actor_id: string | null;
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface GithubInstallationRow {
  id: string;
  workspace_id: string;
  installation_id: number;
  account_login: string;
  account_type: "Organization" | "User";
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GithubRepoRow {
  id: string;
  workspace_id: string;
  installation_id: string;
  repo_id: number;
  full_name: string;
  created_at: string;
}

export interface IssueGithubLinkRow {
  id: string;
  issue_id: string;
  workspace_id: string;
  repo_full_name: string;
  pr_number: number;
  pr_url: string;
  pr_title: string;
  state: "open" | "closed" | "merged";
  branch: string;
  commit_sha: string | null;
  created_at: string;
  updated_at: string;
}
