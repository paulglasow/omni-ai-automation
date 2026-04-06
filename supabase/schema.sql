-- ============================================================
-- OmniAI v4 — Complete Database Schema
-- ============================================================
-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- Paste the entire file and click "Run"
-- ============================================================

-- 1. Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  avatar_url   text,
  context      jsonb default '{}',
  created_at   timestamptz default now()
);

-- 2. Workspaces
create table if not exists workspaces (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references profiles(id) on delete cascade,
  name         text not null,
  description  text,
  type         text default 'general',
  is_public    boolean default false,
  created_at   timestamptz default now()
);

-- 3. Workspace members
create table if not exists workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id      uuid references profiles(id) on delete cascade,
  role         text default 'viewer',
  joined_at    timestamptz default now(),
  primary key (workspace_id, user_id)
);

-- 4. Conversations (chat sessions)
create table if not exists conversations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete set null,
  title        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 5. Messages
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role            text not null,
  content         text not null,
  model           text,
  routed_to       text,
  bucket          text,
  used_models     text[],
  usage           jsonb,
  responses       jsonb,
  created_at      timestamptz default now()
);

-- 6. Uploaded files
create table if not exists files (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete set null,
  name         text not null,
  type         text,
  size         bigint,
  storage_path text,
  extracted_text text,
  created_at   timestamptz default now()
);

-- 7. AI analyses on files
create table if not exists analyses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  file_id      uuid references files(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete set null,
  prompt       text,
  results      jsonb,
  consensus    text,
  created_at   timestamptz default now()
);

-- 8. Usage logs (cost tracking)
create table if not exists usage_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid,
  workspace_id    uuid,
  conversation_id uuid,
  model           text,
  routed_to       text,
  input_tokens    integer default 0,
  output_tokens   integer default 0,
  cost_usd        numeric(12,8) default 0,
  created_at      timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles         enable row level security;
alter table workspaces       enable row level security;
alter table workspace_members enable row level security;
alter table conversations    enable row level security;
alter table messages         enable row level security;
alter table files            enable row level security;
alter table analyses         enable row level security;
alter table usage_logs       enable row level security;

-- Profiles: users see their own
create policy "own_profile" on profiles for all using (auth.uid() = id);

-- Workspaces: owner + members can see
create policy "workspace_access" on workspaces for all
  using (
    owner_id = auth.uid()
    or id in (select workspace_id from workspace_members where user_id = auth.uid())
    or is_public = true
  );

-- Workspace members: visible to members
create policy "member_access" on workspace_members for all
  using (
    user_id = auth.uid()
    or workspace_id in (select id from workspaces where owner_id = auth.uid())
  );

-- Conversations: own conversations
create policy "own_conversations" on conversations for all
  using (user_id = auth.uid());

-- Messages: own conversations' messages
create policy "own_messages" on messages for all
  using (
    conversation_id in (select id from conversations where user_id = auth.uid())
  );

-- Files: own files + workspace files
create policy "file_access" on files for all
  using (
    user_id = auth.uid()
    or workspace_id in (
      select id from workspaces where owner_id = auth.uid()
      union select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

-- Analyses: own analyses + workspace analyses
create policy "analysis_access" on analyses for all
  using (
    user_id = auth.uid()
    or workspace_id in (
      select id from workspaces where owner_id = auth.uid()
      union select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

-- Usage logs: own logs
create policy "own_usage" on usage_logs for all
  using (user_id = auth.uid()::text::uuid);

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_conversations_user on conversations(user_id);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_files_user on files(user_id);
create index if not exists idx_files_workspace on files(workspace_id);
create index if not exists idx_analyses_file on analyses(file_id);
create index if not exists idx_workspace_members_user on workspace_members(user_id);
create index if not exists idx_usage_logs_user on usage_logs(user_id);

-- ============================================================
-- Realtime (for live sync)
-- ============================================================

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table files;
alter publication supabase_realtime add table analyses;

-- ============================================================
-- Storage bucket for file uploads
-- ============================================================
-- NOTE: Run this separately in Supabase → Storage → Create bucket
-- Bucket name: "uploads"
-- Public: No (private)
-- File size limit: 25MB
-- Allowed MIME types: application/pdf, text/plain, text/csv,
--   image/png, image/jpeg, application/json,
--   application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--   application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
