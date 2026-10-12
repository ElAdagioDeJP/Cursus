-- migration: 20261014100000
-- name: issues
-- author: Juan Vargas <juan@delfostrading.com>
-- date: 2026-10-14
-- description: issues + issue_labels + comments + issue_history + FTS español
-- requires: 20261013090000

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  parent_id uuid references issues(id) on delete set null,
  title varchar(200) not null check (char_length(title) >= 3),
  description text not null default '',
  status text not null default 'backlog'
    check (status in ('backlog','todo','in_progress','review','done','canceled')),
  priority smallint not null default 3 check (priority between 0 and 4),
  estimate_points smallint check (estimate_points in (1,2,3,5,8,13,21)),
  assignee_id uuid references users(id) on delete set null,
  due_date date,
  number integer not null,
  sort_key text not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (to_tsvector('spanish', title || ' ' || description)) stored,
  unique (team_id, number)
);
create index if not exists issues_team_status_sort on issues(team_id, status, sort_key);
create index if not exists issues_project on issues(project_id) where project_id is not null;
create index if not exists issues_assignee on issues(assignee_id) where assignee_id is not null;
create index if not exists issues_search on issues using gin(search_vector);

create table if not exists issue_labels (
  issue_id uuid not null references issues(id) on delete cascade,
  label_id uuid not null references labels(id) on delete cascade,
  primary key (issue_id, label_id)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  author_id uuid references users(id) on delete set null,
  body text not null check (char_length(body) >= 1 and char_length(body) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists comments_issue_created on comments(issue_id, created_at);

create table if not exists issue_history (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  actor_id uuid references users(id) on delete set null,
  field text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);
create index if not exists history_issue_created on issue_history(issue_id, created_at);

drop trigger if exists trg_issues_updated on issues;
create trigger trg_issues_updated before update on issues
  for each row execute function set_updated_at();
drop trigger if exists trg_comments_updated on comments;
create trigger trg_comments_updated before update on comments
  for each row execute function set_updated_at();
