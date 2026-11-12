-- ============================================================================
-- ClockIt — Phase 12 schema (revision 2: namespaced for a shared project)
-- ----------------------------------------------------------------------------
-- THIS PROJECT IS SHARED with an older café application that owns the
-- existing public tables: cafes, favorites, menu_items, profiles, reviews.
--
-- Revision 1 assumed it owned `public.profiles` and failed. This revision
-- adapts ClockIt to coexist with that application instead.
--
-- COEXISTENCE CONTRACT — this migration
--   * never reads, writes, alters, renames, moves or drops a café object;
--   * creates ONLY `clockit_`-prefixed tables, indexes and policies;
--   * references `public.profiles` nowhere (the café's `profiles` has
--     id / display_name / avatar_url / achievements / created_at and no
--     `user_id`, so it is not and cannot be ClockIt's profile table);
--   * uses ClockIt-only helper names (`clockit_set_updated_at`,
--     `clockit_handle_new_user`) so it can never replace a café function;
--   * installs its sign-up trigger under the unique name
--     `clockit_on_auth_user_created` and never drops the café application's
--     own trigger(s) on auth.users.
--
-- ClockIt tables (all prefixed):
--   clockit_profiles, clockit_workspaces, clockit_tasks,
--   clockit_focus_sessions, clockit_habits, clockit_calendar_events,
--   clockit_timeline_events, clockit_notes, clockit_note_folders,
--   clockit_quick_notes, clockit_user_preferences
--
-- Design notes (unchanged from revision 1)
--   * UUID primary keys (`id uuid default gen_random_uuid()`).
--   * `user_id uuid references auth.users (id)` on every owned table — the one
--     column every RLS policy checks.
--   * The app keeps its human-readable ids (`t-1`, `personal`). They live in
--     `client_id`, unique per user, so upserts stay idempotent while the row
--     still gets a UUID.
--
-- Idempotent: safe to run more than once.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- CLOCKIT-ONLY HELPERS
-- Deliberately prefixed: a café function named `set_updated_at` /
-- `handle_new_user` must survive this migration untouched.
-- ============================================================================

create or replace function public.clockit_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

-- ============================================================================
-- TABLES — every one created by ClockIt, every one `clockit_`-prefixed
-- ============================================================================

-- ----------------------------------------------------------------- profiles
create table if not exists public.clockit_profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  name        text,
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- --------------------------------------------------------------- workspaces
create table if not exists public.clockit_workspaces (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  client_id   text not null,
  name        text not null,
  color       text,
  description text,
  icon        text,
  cover       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, client_id)
);

-- -------------------------------------------------------------------- tasks
create table if not exists public.clockit_tasks (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  client_id            text not null,
  title                text not null default 'Untitled Task',
  description          text,
  workspace            text,
  category_color       text,
  deadline             text,
  due_date             date,
  due_time             text,
  days_left            text,
  priority             text,
  status               text,
  completed            boolean not null default false,
  estimate             text,
  is_today             boolean not null default false,
  is_overdue           boolean not null default false,
  tags                 text[] not null default '{}',
  focus_minutes        integer not null default 0,
  focus_sessions_count integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (user_id, client_id)
);

-- ----------------------------------------------------------- focus sessions
create table if not exists public.clockit_focus_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  client_id        text not null,
  task_id          text,
  task_title       text,
  mode             text,
  duration_minutes integer not null default 0,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  unique (user_id, client_id)
);

-- ------------------------------------------------------------------- habits
create table if not exists public.clockit_habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  client_id   text not null,
  title       text not null,
  time        text,
  duration    text,
  icon_name   text,
  completed   boolean not null default false,
  streak      integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, client_id)
);

-- ---------------------------------------------------------- calendar events
create table if not exists public.clockit_calendar_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  client_id   text not null,
  day         integer,
  title       text not null,
  time        text,
  workspace   text,
  color       text,
  tag_color   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, client_id)
);

-- ---------------------------------------------------------- timeline events
create table if not exists public.clockit_timeline_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  client_id   text not null,
  time        text,
  title       text not null,
  subtitle    text,
  color       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, client_id)
);

-- -------------------------------------------------------------------- notes
create table if not exists public.clockit_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  client_id   text not null,
  title       text not null default 'Untitled Note',
  folder_id   text,
  content     text,
  tags        text[] not null default '{}',
  is_favorite boolean not null default false,
  is_trash    boolean not null default false,
  is_template boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, client_id)
);

-- ------------------------------------------------------------- note folders
create table if not exists public.clockit_note_folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  client_id   text not null,
  name        text not null,
  color       text,
  parent_id   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, client_id)
);

-- ------------------------------------------------------------- quick notes
create table if not exists public.clockit_quick_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  client_id   text not null,
  body        text not null,
  sort_index  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, client_id)
);

-- ------------------------------------------------------- user preferences
create table if not exists public.clockit_user_preferences (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null unique references auth.users (id) on delete cascade,
  theme                  text not null default 'light',
  sidebar_collapsed      boolean not null default false,
  notification_read_keys text[] not null default '{}',
  active_workspace_id    text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ============================================================================
-- INDEXES — prefixed both in name and in target, so nothing here can collide
-- with a café index
-- ============================================================================
create index if not exists clockit_workspaces_user_idx      on public.clockit_workspaces (user_id);
create index if not exists clockit_tasks_user_idx           on public.clockit_tasks (user_id);
create index if not exists clockit_tasks_user_due_idx       on public.clockit_tasks (user_id, due_date);
create index if not exists clockit_focus_user_idx           on public.clockit_focus_sessions (user_id);
create index if not exists clockit_focus_user_completed_idx on public.clockit_focus_sessions (user_id, completed_at desc);
create index if not exists clockit_habits_user_idx          on public.clockit_habits (user_id);
create index if not exists clockit_cal_user_day_idx         on public.clockit_calendar_events (user_id, day);
create index if not exists clockit_timeline_user_idx        on public.clockit_timeline_events (user_id);
create index if not exists clockit_notes_user_idx           on public.clockit_notes (user_id);
create index if not exists clockit_notes_user_folder_idx    on public.clockit_notes (user_id, folder_id);
create index if not exists clockit_notes_user_updated_idx   on public.clockit_notes (user_id, updated_at desc);
create index if not exists clockit_note_folders_user_idx    on public.clockit_note_folders (user_id);
create index if not exists clockit_quick_notes_user_idx     on public.clockit_quick_notes (user_id, sort_index);

-- ============================================================================
-- updated_at maintenance — ClockIt trigger function, ClockIt tables only
-- ============================================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'clockit_profiles', 'clockit_workspaces', 'clockit_tasks', 'clockit_habits',
    'clockit_calendar_events', 'clockit_timeline_events', 'clockit_notes',
    'clockit_note_folders', 'clockit_user_preferences'
  ]
  loop
    execute format('drop trigger if exists clockit_set_updated_at on public.%I', t);
    execute format(
      'create trigger clockit_set_updated_at before update on public.%I '
      'for each row execute function public.clockit_set_updated_at()', t
    );
  end loop;
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY — enabled and forced on every ClockIt table.
-- One policy per table: a row is visible/writable only to its owner, and
-- `with check` blocks inserting or re-pointing a row at another user.
-- No café table is touched, and no café policy is dropped or altered.
-- ============================================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'clockit_profiles', 'clockit_workspaces', 'clockit_tasks',
    'clockit_focus_sessions', 'clockit_habits', 'clockit_calendar_events',
    'clockit_timeline_events', 'clockit_notes', 'clockit_note_folders',
    'clockit_quick_notes', 'clockit_user_preferences'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists "ClockIt users manage their own rows" on public.%I', t);
    execute format(
      'create policy "ClockIt users manage their own rows" on public.%I '
      'for all to authenticated '
      'using (auth.uid() = user_id) '
      'with check (auth.uid() = user_id)', t
    );
  end loop;
end;
$$;

-- ============================================================================
-- SIGN-UP BOOTSTRAP — ClockIt-only function name, ClockIt tables only.
-- This does NOT create a café `profiles` row: the café application's own
-- trigger on auth.users remains responsible for that.
-- ============================================================================
create or replace function public.clockit_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.clockit_profiles (user_id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email
  )
  on conflict (user_id) do nothing;

  insert into public.clockit_user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- The trigger name is unique to ClockIt. The café application's own trigger
-- (commonly `on_auth_user_created`) is intentionally left in place, so both
-- applications bootstrap independently from the same sign-up event.
drop trigger if exists clockit_on_auth_user_created on auth.users;
create trigger clockit_on_auth_user_created
  after insert on auth.users
  for each row execute function public.clockit_handle_new_user();
