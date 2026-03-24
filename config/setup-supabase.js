#!/usr/bin/env node
/**
 * OmniAI v4 — Supabase Setup
 * Creates the required database tables for OmniAI conversation history and settings.
 */

'use strict';

require('dotenv').config();

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

// SQL schema — also written to templates/supabase-schema.sql
const SCHEMA_SQL = `
-- OmniAI v4 Database Schema
-- Run this in your Supabase SQL Editor to create all required tables.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Conversations ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      TEXT NOT NULL,
  title        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Messages ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id  UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content          TEXT NOT NULL,
  ai_model         TEXT,            -- 'gpt-4o', 'claude-3-opus', 'gemini-pro', etc.
  tokens_used      INTEGER,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── User Settings ─────────────────────────────────────────────────────────────
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

-- ── Financial Snapshots ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         TEXT NOT NULL,
  source          TEXT NOT NULL CHECK (source IN ('empower', 'monarch', 'manual')),
  snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  net_worth       NUMERIC(15,2),
  data_json       JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI Routing Log ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routing_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id    UUID REFERENCES messages(id) ON DELETE CASCADE,
  query_type    TEXT,             -- 'financial', 'coding', 'creative', 'research', 'general'
  models_used   TEXT[],           -- ['gpt-4o', 'claude-3-opus']
  routing_reason TEXT,
  latency_ms    INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_snapshots_user_date
  ON financial_snapshots (user_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user
  ON conversations (user_id, updated_at DESC);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own data
CREATE POLICY "Users see own conversations" ON conversations
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users see own messages" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users see own settings" ON user_settings
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users see own financial data" ON financial_snapshots
  FOR ALL USING (user_id = auth.uid()::text);

-- ── Trigger: update updated_at automatically ──────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS \$\$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

function supabaseRequest(url, serviceKey, sql) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(`${url}/rest/v1/rpc/exec_sql`);
    const data   = JSON.stringify({ query: sql });

    const options = {
      hostname: urlObj.hostname,
      path:     `${urlObj.pathname}?${urlObj.searchParams}`,
      method:   'POST',
      headers:  {
        'apikey':         serviceKey,
        'Authorization':  `Bearer ${serviceKey}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const protocol = urlObj.protocol === 'https:' ? https : require('http');
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', c => { body += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Request timed out')); });
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`\n${BOLD}OmniAI v4 — Supabase Setup${RESET}\n`);

  const url     = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !svcKey) {
    console.log(`  ${RED}✗${RESET} Supabase credentials not set`);
    console.log(`  Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file`);
    console.log(`  Find them at: https://supabase.com/dashboard/project/_/settings/api\n`);
    process.exit(1);
  }

  console.log(`  ${GREEN}✓${RESET} Supabase URL: ${url}`);

  // Write the schema file regardless of connection status
  const schemaPath = path.join(__dirname, '..', 'templates', 'supabase-schema.sql');
  fs.writeFileSync(schemaPath, SCHEMA_SQL.trim());
  console.log(`  ${GREEN}✓${RESET} Schema SQL written to templates/supabase-schema.sql`);

  console.log('  Applying database schema...');
  console.log(`  ${YELLOW}Note:${RESET} If automatic migration fails, copy templates/supabase-schema.sql`);
  console.log(`  and paste it into the Supabase SQL Editor at: ${url}/project/default/sql\n`);

  // Try applying schema via REST API
  try {
    const { status } = await supabaseRequest(url, svcKey, SCHEMA_SQL);
    if (status === 200 || status === 204) {
      console.log(`  ${GREEN}✓${RESET} Database schema applied successfully`);
    } else {
      console.log(`  ${YELLOW}⚠${RESET}  Could not auto-apply schema (HTTP ${status})`);
      console.log(`  Apply manually: copy templates/supabase-schema.sql → Supabase SQL Editor`);
    }
  } catch (err) {
    console.log(`  ${YELLOW}⚠${RESET}  Auto-migration skipped: ${err.message}`);
    console.log(`  Apply manually: copy templates/supabase-schema.sql → Supabase SQL Editor`);
  }

  console.log(`\n  ${GREEN}${BOLD}Supabase setup complete!${RESET}\n`);
}

main().catch(err => {
  console.error(`\n${RED}Unexpected error: ${err.message}${RESET}`);
  process.exit(1);
});
