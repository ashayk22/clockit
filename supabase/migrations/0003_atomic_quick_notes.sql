-- ============================================================================
-- ClockIt — Phase 13.2 Migration 0003: Atomic Quick Notes Synchronization
-- ----------------------------------------------------------------------------
-- STRICT COEXISTENCE NOTICE:
-- This Supabase instance is shared with an older café application that owns
-- public tables: cafes, favorites, menu_items, profiles, reviews.
--
-- This migration touches ONLY clockit_* tables and ClockIt-prefixed functions.
-- It NEVER modifies, renames, drops, or alters any café object or policy.
--
-- CHANGES:
-- 1. Creates an atomic transactional RPC function `clockit_replace_quick_notes`:
--    - Runs within a single ACID transaction block
--    - Enforces auth.uid() authorization: only the authenticated caller's rows
--      are deleted and replaced
--    - Replaces sequential non-atomic client-side DELETE + INSERT
--    - Prevents partial cloud state or lost notes during network interruption
--
-- Idempotent: safe to run more than once.
-- ============================================================================

create or replace function public.clockit_replace_quick_notes(p_notes jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_note record;
  v_index integer := 0;
begin
  -- 1. Verify caller is authenticated
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required to synchronize quick notes.';
  end if;

  -- 2. Validate input parameter
  if p_notes is null or jsonb_typeof(p_notes) <> 'array' then
    raise exception 'Input p_notes must be a JSON array of note objects or strings.';
  end if;

  -- 3. Atomic replacement within transaction:
  -- First remove existing quick notes for this user
  delete from public.clockit_quick_notes
  where user_id = v_user_id;

  -- 4. Insert the complete replacement set
  for v_note in select * from jsonb_array_elements(p_notes) as elem
  loop
    declare
      v_body text;
      v_client_id text;
    begin
      -- Support array of objects {"body": "...", "client_id": "..."} or array of raw strings
      if jsonb_typeof(v_note.elem) = 'object' then
        v_body := coalesce(v_note.elem->>'body', '');
        v_client_id := coalesce(v_note.elem->>'client_id', 'qn-' || v_index || '-' || md5(random()::text));
      else
        v_body := coalesce(v_note.elem #>> '{}', '');
        v_client_id := 'qn-' || v_index || '-' || length(v_body) || '-' || substr(md5(v_body || random()::text), 1, 12);
      end if;

      insert into public.clockit_quick_notes (user_id, client_id, body, sort_index)
      values (v_user_id, v_client_id, v_body, v_index);

      v_index := v_index + 1;
    end;
  end loop;
end;
$$;

-- Grant execution to authenticated users only (anon is explicitly blocked)
grant execute on function public.clockit_replace_quick_notes(jsonb) to authenticated;
revoke execute on function public.clockit_replace_quick_notes(jsonb) from anon, public;
