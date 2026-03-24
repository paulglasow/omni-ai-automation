-- OmniAI v4 Database Schema
-- ============================================================
-- HOW TO USE:
-- 1. Go to your Supabase project dashboard
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Paste this entire file and click "Run"
-- 4. All tables, indexes, and security policies will be created
-- ============================================================

-- Enable UUID extension (required for auto-generated IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Conversations ────────────────────────────────────────────────────────────
-- Each conversation is a chat session between the user and OmniAI
CREATE TABLE IF NOT EXISTS conversations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      TEXT NOT NULL,
  title        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE conversations IS 'OmniAI v4 — chat conversation sessions';

-- ── Messages ─────────────────────────────────────────────────────────────────
-- Individual messages within each conversation
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id  UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content          TEXT NOT NULL,
  ai_model         TEXT,            -- 'gpt-4o', 'claude-3-opus', 'gemini-pro', etc.
  tokens_used      INTEGER,
  cost_usd         NUMERIC(10, 6),  -- Cost in USD; populated by the application layer based on tokens_used × model pricing
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE messages IS 'OmniAI v4 — individual messages in conversations';

-- ── User Settings ─────────────────────────────────────────────────────────────
-- User preferences and configuration
CREATE TABLE IF NOT EXISTS user_settings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             TEXT UNIQUE NOT NULL,
  preferred_ai        TEXT DEFAULT 'auto',
  financial_enabled   BOOLEAN DEFAULT FALSE,
  github_enabled      BOOLEAN DEFAULT FALSE,
  notification_prefs  JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_settings IS 'OmniAI v4 — per-user preferences and settings';

-- ── Financial Snapshots ───────────────────────────────────────────────────────
-- Daily snapshots of financial data from Empower and Monarch
CREATE TABLE IF NOT EXISTS financial_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         TEXT NOT NULL,
  source          TEXT NOT NULL CHECK (source IN ('empower', 'monarch', 'manual')),
  snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  net_worth       NUMERIC(15,2),
  data_json       JSONB,             -- Full financial data as JSON
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE financial_snapshots IS 'OmniAI v4 — daily financial data snapshots';

-- ── AI Routing Log ────────────────────────────────────────────────────────────
-- Tracks which AI was used for each message and why
CREATE TABLE IF NOT EXISTS routing_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id    UUID REFERENCES messages(id) ON DELETE CASCADE,
  query_type    TEXT,             -- 'financial', 'coding', 'creative', 'research', 'general'
  models_used   TEXT[],           -- e.g. ['gpt-4o', 'claude-3-opus']
  routing_reason TEXT,
  latency_ms    INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE routing_log IS 'OmniAI v4 — AI model routing decisions log';

-- ── Indexes (for fast queries) ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_snapshots_user_date
  ON financial_snapshots (user_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user
  ON conversations (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_model
  ON messages (ai_model, created_at DESC);

-- ── Row Level Security (RLS) ──────────────────────────────────────────────────
-- Users can only see their own data — other users' data is hidden
ALTER TABLE conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_snapshots ENABLE ROW LEVEL SECURITY;

-- Conversations: users see only their own
CREATE POLICY "Users see own conversations" ON conversations
  FOR ALL USING (user_id = auth.uid()::text);

-- Messages: users see only messages in their conversations
CREATE POLICY "Users see own messages" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()::text
    )
  );

-- Settings: users see only their own settings
CREATE POLICY "Users see own settings" ON user_settings
  FOR ALL USING (user_id = auth.uid()::text);

-- Financial: users see only their own financial data
CREATE POLICY "Users see own financial data" ON financial_snapshots
  FOR ALL USING (user_id = auth.uid()::text);

-- ── Auto-update timestamps ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Verify setup ──────────────────────────────────────────────────────────────
-- This query shows all created tables — run it to confirm success
SELECT
  table_name,
  pg_size_pretty(pg_relation_size(quote_ident(table_name)::regclass)) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('conversations', 'messages', 'user_settings', 'financial_snapshots', 'routing_log')
ORDER BY table_name;
