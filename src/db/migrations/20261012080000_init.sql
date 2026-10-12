-- migration: 20261012080000
-- name: init
-- author: Juan Vargas <juan@delfostrading.com>
-- date: 2026-10-12
-- description: users, accounts OAuth, sessions, workspaces, memberships
-- requires: none

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email citext unique,
  email_verified timestamptz,
  image text,
  created_at timestamptz not null default now()
);

create table if not exists accounts (
  user_id uuid not null references users(id) on delete cascade,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  primary key (user_id, provider),
  unique (provider, provider_account_id)
);

create table if not exists sessions (
  session_token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  primary key (identifier, token)
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  user_id uuid not null references users(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','guest')),
  primary key (user_id, workspace_id)
);
create index if not exists memberships_workspace on memberships(workspace_id);
