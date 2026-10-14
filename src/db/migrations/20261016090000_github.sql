-- migration: 20261016090000
-- name: github
-- author: Juan Vargas <juan@delfostrading.com>
-- date: 2026-10-16
-- description: integracion GitHub App estilo Linear: instalaciones, repos y vinculos issue-PR
-- requires: 20261015090000

create table if not exists github_installations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  installation_id bigint not null,
  account_login text not null default '',
  account_type text not null default 'Organization'
    check (account_type in ('Organization', 'User')),
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, installation_id)
);
create index if not exists github_installations_installation
  on github_installations(installation_id);

create table if not exists github_repos (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  installation_id uuid not null references github_installations(id) on delete cascade,
  repo_id bigint not null,
  full_name text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, repo_id),
  unique (workspace_id, full_name)
);
create index if not exists github_repos_full_name
  on github_repos(full_name);

create table if not exists issue_github_links (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  repo_full_name text not null,
  pr_number integer not null check (pr_number > 0),
  pr_url text not null default '',
  pr_title text not null default '',
  state text not null default 'open'
    check (state in ('open', 'closed', 'merged')),
  branch text not null default '',
  commit_sha text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (issue_id, repo_full_name, pr_number)
);
create index if not exists issue_github_links_issue
  on issue_github_links(issue_id);
create index if not exists issue_github_links_repo_pr
  on issue_github_links(repo_full_name, pr_number);

drop trigger if exists trg_github_installations_updated on github_installations;
create trigger trg_github_installations_updated before update on github_installations
  for each row execute function set_updated_at();
drop trigger if exists trg_issue_github_links_updated on issue_github_links;
create trigger trg_issue_github_links_updated before update on issue_github_links
  for each row execute function set_updated_at();
