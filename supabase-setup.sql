-- VWO Leerplatform - Supabase Database Setup
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- No storage bucket needed — files are linked from Google Drive/OneDrive

-- Vakken (subjects)
create table subjects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null default '#6366f1',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Taken (tasks)
create table tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  note        text,
  due_date    date,
  subject_id  uuid references subjects(id) on delete set null,
  is_done     boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Mappen per taak of opdracht (task/assignment folders)
create table task_folders (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid references tasks(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete cascade,
  name          text not null,
  is_default    boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  check (task_id is not null or assignment_id is not null)
);

-- Attachments (uploaded files + links)
create table attachments (
  id            uuid primary key default gen_random_uuid(),
  folder_id     uuid not null references task_folders(id) on delete cascade,
  type          text not null check (type in ('image', 'pdf', 'youtube', 'link')),
  title         text,
  url           text,
  storage_path  text,
  created_at    timestamptz not null default now()
);

-- Pomodoro sessies
create table pomodoros (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid references subjects(id) on delete set null,
  started_at  timestamptz not null,
  ended_at    timestamptz,
  duration    int not null default 1500,
  completed   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Becijferde opdrachten (graded assignments)
create table assignments (
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
create table assignment_tasks (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  task_id       uuid not null references tasks(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique(assignment_id, task_id)
);

-- Enable Row Level Security (permissive for single-user app)
alter table subjects enable row level security;
alter table tasks enable row level security;
alter table task_folders enable row level security;
alter table attachments enable row level security;
alter table pomodoros enable row level security;

create policy "allow_all" on subjects for all using (true) with check (true);
create policy "allow_all" on tasks for all using (true) with check (true);
create policy "allow_all" on task_folders for all using (true) with check (true);
create policy "allow_all" on attachments for all using (true) with check (true);
create policy "allow_all" on pomodoros for all using (true) with check (true);

alter table assignments enable row level security;
alter table assignment_tasks enable row level security;
create policy "allow_all" on assignments for all using (true) with check (true);
create policy "allow_all" on assignment_tasks for all using (true) with check (true);
