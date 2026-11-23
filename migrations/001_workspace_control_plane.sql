CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY,
  owner_id TEXT NOT NULL,
  repository TEXT NOT NULL,
  git_ref TEXT NOT NULL DEFAULT 'main',
  template TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'github-codespaces',
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('handoff_ready','requested','queued','provisioning','running','stopping','stopped','failed','deleted')),
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS workspaces_owner_created_idx
  ON workspaces (owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','editor','viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS workspace_members_user_idx
  ON workspace_members (user_id, workspace_id);

INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT id, owner_id, 'owner' FROM workspaces
ON CONFLICT (workspace_id, user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS workspace_jobs (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('queued','running','retry_wait','succeeded','failed','dead_letter','cancelled')),
  attempt INTEGER NOT NULL DEFAULT 0 CHECK (attempt >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts > 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_owner TEXT,
  lease_expires_at TIMESTAMPTZ,
  cancel_requested_at TIMESTAMPTZ,
  idempotency_key TEXT NOT NULL,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, idempotency_key)
);

ALTER TABLE workspace_jobs ADD COLUMN IF NOT EXISTS cancel_requested_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS workspace_jobs_claim_idx
  ON workspace_jobs (state, available_at, created_at);

CREATE INDEX IF NOT EXISTS workspace_jobs_lease_idx
  ON workspace_jobs (lease_expires_at)
  WHERE state = 'running';

CREATE TABLE IF NOT EXISTS workspace_audit_events (
  id UUID PRIMARY KEY,
  actor_id TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL,
  request_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workspace_audit_owner_time_idx
  ON workspace_audit_events (actor_id, created_at DESC);
