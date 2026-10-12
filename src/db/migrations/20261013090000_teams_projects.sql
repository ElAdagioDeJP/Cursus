-- migration: 20261013090000
-- name: teams_projects
-- author: Juan Vargas <juan@delfostrading.com>
-- date: 2026-10-13
-- description: teams con key por workspace, projects, project_teams, labels
-- requires: 20261012080000

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  key varchar(6) not null check (key ~ '^[A-Z]{2,6}$'),
  next_issue_number integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, key)
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null check (char_length(name) >= 2),
  key varchar(6) not null check (key ~ '^[A-Z]{2,6}$'),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, key)
);

create table if not exists project_teams (
  project_id uuid not null references projects(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  primary key (project_id, team_id)
);

create table if not exists labels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null check (char_length(name) >= 1),
  color char(7) not null default '#6b7280' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

drop trigger if exists trg_teams_updated on teams;
create trigger trg_teams_updated before update on teams
  for each row execute function set_updated_at();
drop trigger if exists trg_projects_updated on projects;
create trigger trg_projects_updated before update on projects
  for each row execute function set_updated_at();
