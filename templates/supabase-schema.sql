-- =============================================================================
-- templates/supabase-schema.sql
--
-- OmniAI v4 Collaborative Workspaces Schema
-- Run this in the Supabase SQL editor or via the Supabase CLI migration runner.
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- Workspaces
-- =============================================================================

CREATE TABLE IF NOT EXISTS workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Workspace Members (RBAC)
-- =============================================================================

CREATE TABLE IF NOT EXISTS workspace_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'viewer'
                  CHECK (role IN ('viewer', 'editor', 'admin')),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

-- =============================================================================
-- Workspace Invites
-- =============================================================================

CREATE TABLE IF NOT EXISTS workspace_invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_email   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'viewer'
                    CHECK (role IN ('viewer', 'editor', 'admin')),
  token           TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Conversations (shared history with cost metadata)
-- =============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT,
  model         TEXT,
  routed_to     TEXT,
  cost_usd      NUMERIC(12, 8) NOT NULL DEFAULT 0,
  input_tokens  INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Usage Logs (per-request cost records)
-- =============================================================================

CREATE TABLE IF NOT EXISTS usage_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  model           TEXT,
  routed_to       TEXT,
  input_tokens    INTEGER NOT NULL DEFAULT 0,
  output_tokens   INTEGER NOT NULL DEFAULT 0,
  cost_usd        NUMERIC(12, 8) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Budget Alerts
-- =============================================================================

CREATE TABLE IF NOT EXISTS budget_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  threshold_usd NUMERIC(10, 4) NOT NULL,
  notify_email  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id
  ON workspace_members(user_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id
  ON workspace_members(workspace_id);

CREATE INDEX IF NOT EXISTS idx_usage_logs_workspace_id
  ON usage_logs(workspace_id);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id
  ON usage_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at
  ON usage_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_workspace_id
  ON conversations(workspace_id);

-- =============================================================================
-- Row-Level Security Policies
-- =============================================================================

ALTER TABLE workspaces       ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts    ENABLE ROW LEVEL SECURITY;

-- workspaces: visible to owner and members; public workspaces visible to all
CREATE POLICY "workspaces_select" ON workspaces
  FOR SELECT USING (
    is_public = TRUE
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspaces.id AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "workspaces_insert" ON workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "workspaces_delete" ON workspaces
  FOR DELETE USING (owner_id = auth.uid());

-- workspace_members: visible to workspace members
CREATE POLICY "workspace_members_select" ON workspace_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id AND wm2.user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_members_insert" ON workspace_members
  FOR INSERT WITH CHECK (
    -- Only admins/owners can add members (enforced in API layer; RLS is a backstop)
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid() AND wm.role = 'admin'
    )
  );

-- workspace_invites: only owner/admin can see pending invites
CREATE POLICY "workspace_invites_select" ON workspace_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_invites.workspace_id AND w.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_invites.workspace_id
        AND wm.user_id = auth.uid() AND wm.role = 'admin'
    )
  );

-- conversations: visible to workspace members; personal ones visible to owner
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (
    user_id = auth.uid()
    OR (workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = conversations.workspace_id AND wm.user_id = auth.uid()
    ))
  );

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM workspace_members wm
        WHERE wm.workspace_id = conversations.workspace_id AND wm.user_id = auth.uid()
      )
    )
  );

-- usage_logs: users see their own records; workspace members see workspace records
CREATE POLICY "usage_logs_select" ON usage_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR (workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = usage_logs.workspace_id AND wm.user_id = auth.uid()
    ))
  );

-- budget_alerts: own records only
CREATE POLICY "budget_alerts_select" ON budget_alerts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "budget_alerts_insert" ON budget_alerts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "budget_alerts_update" ON budget_alerts
  FOR UPDATE USING (user_id = auth.uid());

-- =============================================================================
-- Real-time subscriptions
-- Enables live updates in connected clients (web and native)
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE usage_logs;
