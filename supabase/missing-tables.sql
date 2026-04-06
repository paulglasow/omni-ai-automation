-- ============================================================
-- Missing Tables — Run this in Supabase SQL Editor
-- ============================================================

-- Tasks
create table if not exists tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid,
  workspace_id uuid,
  text         text not null,
  priority     text default 'medium',
  done         boolean default false,
  due_date     text,
  created_at   timestamptz default now()
);

-- Meetings
create table if not exists meetings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid,
  workspace_id uuid,
  title        text,
  content      text,
  created_at   timestamptz default now()
);

-- Learning topics
create table if not exists learning_topics (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid,
  name         text not null,
  progress     integer default 0,
  notes        text,
  created_at   timestamptz default now()
);

-- Enable RLS
alter table tasks            enable row level security;
alter table meetings         enable row level security;
alter table learning_topics  enable row level security;

-- Allow all access (since we don't have auth fully enforced yet)
create policy "allow_all_tasks" on tasks for all using (true) with check (true);
create policy "allow_all_meetings" on meetings for all using (true) with check (true);
create policy "allow_all_learning" on learning_topics for all using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table meetings;
