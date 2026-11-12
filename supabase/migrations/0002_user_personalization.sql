-- ============================================================================
-- ClockIt — Phase 12.4 Migration 0002: User Personalization & Identity
-- ----------------------------------------------------------------------------
-- STRICT COEXISTENCE NOTICE:
-- This Supabase instance is shared with an older café application that owns
-- public tables: cafes, favorites, menu_items, profiles, reviews.
--
-- This migration touches ONLY clockit_* tables and ClockIt-prefixed functions.
-- It NEVER modifies, renames, drops, or alters any café object or policy.
--
-- CHANGES:
-- 1. Updates clockit_handle_new_user() trigger function:
--    - Uses full name from new.raw_user_meta_data ->> 'name'
--    - NEVER falls back to email prefix (split_part)
--    - Defaults to 'ClockIt user' if no name provided
--    - Updates clockit_profiles on conflict if the existing name was empty
--      or was an older email prefix fallback
--
-- 2. Adds personalization columns to clockit_user_preferences:
--    - onboarding_completed (boolean, default false)
--    - productivity_challenges (text array, default '{}')
--    - planning_preference (text)
--    - preferred_focus_duration (integer, default 25)
--    - appearance_preference (text, default 'system')
--
-- Idempotent: safe to run more than once.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enhance clockit_user_preferences with personalization fields
-- ----------------------------------------------------------------------------
alter table public.clockit_user_preferences
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists productivity_challenges text[] not null default '{}',
  add column if not exists planning_preference text,
  add column if not exists preferred_focus_duration integer not null default 25,
  add column if not exists appearance_preference text not null default 'system';

-- ----------------------------------------------------------------------------
-- 2. Update ClockIt user bootstrap function (no email-prefix display name)
-- ----------------------------------------------------------------------------
create or replace function public.clockit_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cleaned_name text;
begin
  -- Extract full name from signup metadata and sanitize
  cleaned_name := nullif(trim(new.raw_user_meta_data ->> 'name'), '');
  if cleaned_name is null then
    cleaned_name := 'ClockIt user';
  end if;

  -- Insert profile for new ClockIt user. If row already exists from earlier,
  -- replace name only if it was empty or was an email prefix fallback.
  insert into public.clockit_profiles (user_id, name, email)
  values (
    new.id,
    cleaned_name,
    new.email
  )
  on conflict (user_id) do update set
    name = case
      when clockit_profiles.name is null
        or clockit_profiles.name = ''
        or clockit_profiles.name = 'ClockIt user'
        or clockit_profiles.name = split_part(coalesce(new.email, ''), '@', 1)
      then excluded.name
      else clockit_profiles.name
    end,
    email = excluded.email;

  -- Initialize ClockIt user preferences with sensible defaults
  insert into public.clockit_user_preferences (
    user_id,
    theme,
    appearance_preference,
    onboarding_completed,
    preferred_focus_duration
  )
  values (
    new.id,
    'light',
    'system',
    false,
    25
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Ensure ClockIt-only trigger is registered cleanly
drop trigger if exists clockit_on_auth_user_created on auth.users;
create trigger clockit_on_auth_user_created
  after insert on auth.users
  for each row execute function public.clockit_handle_new_user();

-- Verify RLS remains active and enforced
alter table public.clockit_user_preferences enable row level security;
alter table public.clockit_user_preferences force row level security;
