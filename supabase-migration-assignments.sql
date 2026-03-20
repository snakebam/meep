-- Migration: Add graded assignments (becijferde opdrachten)
-- Run this in Supabase SQL Editor if you already have the base tables

-- Becijferde opdrachten (graded assignments)
create table if not exists assignments (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  note        text,
  due_date    date,
  subject_id  uuid references subjects(id) on delete set null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Link tasks to assignments
create table if not exists assignment_tasks (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  task_id       uuid not null references tasks(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique(assignment_id, task_id)
);

-- Allow task_folders to belong to assignments too
alter table task_folders alter column task_id drop not null;
alter table task_folders add column if not exists assignment_id uuid references assignments(id) on delete cascade;

-- RLS
alter table assignments enable row level security;
alter table assignment_tasks enable row level security;
create policy "allow_all" on assignments for all using (true) with check (true);
create policy "allow_all" on assignment_tasks for all using (true) with check (true);
