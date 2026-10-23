-- Focus Forge initial schema
-- Apply via: Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/pdlivijxfoutgdekygjv/sql/new

-- ─── Tasks ────────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        references auth.users on delete cascade not null,
  title         text        not null,
  notes         text,
  done          boolean     not null default false,
  priority      text        not null default 'med'
                            check (priority in ('low', 'med', 'high')),
  due_date      date        not null,
  estimate_min  integer,
  tag           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "tasks: users manage own rows" on tasks
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Habits ───────────────────────────────────────────────────────────────────
create table if not exists habits (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users on delete cascade not null,
  name       text        not null,
  emoji      text        not null default '🔥',
  streak     integer     not null default 0,
  target     integer     not null default 7,
  color      text        not null default 'ember'
             check (color in ('ember', 'amber', 'violet', 'teal')),
  created_at timestamptz not null default now()
);

alter table habits enable row level security;

create policy "habits: users manage own rows" on habits
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Habit logs (one row per day a habit was completed) ───────────────────────
create table if not exists habit_logs (
  id          uuid        primary key default gen_random_uuid(),
  habit_id    uuid        references habits on delete cascade not null,
  user_id     uuid        references auth.users on delete cascade not null,
  logged_date date        not null,
  created_at  timestamptz not null default now(),
  unique (habit_id, logged_date)
);

alter table habit_logs enable row level security;

create policy "habit_logs: users manage own rows" on habit_logs
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Focus sessions ───────────────────────────────────────────────────────────
create table if not exists focus_sessions (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references auth.users on delete cascade not null,
  started_at   timestamptz not null default now(),
  duration_min integer     not null,
  task_title   text,
  created_at   timestamptz not null default now()
);

alter table focus_sessions enable row level security;

create policy "focus_sessions: users manage own rows" on focus_sessions
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Auto-update tasks.updated_at ─────────────────────────────────────────────
create or replace function _set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function _set_updated_at();
