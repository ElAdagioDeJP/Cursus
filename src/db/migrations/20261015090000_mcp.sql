-- migration: 20261015090000
-- name: mcp
-- author: Juan Vargas <juan@delfostrading.com>
-- date: 2026-10-15
-- description: api_keys MCP por workspace + auditoría mcp_audit con idempotencia
-- requires: 20261014100000

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  key_hash char(64) not null unique,
  scopes text[] not null default '{read}',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create table if not exists mcp_audit (
  id uuid primary key default gen_random_uuid(),
  key_id uuid references api_keys(id) on delete set null,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  tool text not null,
  input jsonb not null default '{}',
  client_mutation_id text,
  result jsonb,
  status text not null default 'ok' check (status in ('ok','error','denied','rate_limited')),
  error text,
  duration_ms integer not null default 0,
  created_at timestamptz not null default now(),
  unique (key_id, tool, client_mutation_id)
);
create index if not exists mcp_audit_workspace_created on mcp_audit(workspace_id, created_at desc);
