# ClockIt — Phase 13.6 Migration Preflight

**Type:** Read-only audit\
**Date:** 2026-11-12\
**Development project:** `nook` (`gynycspbhfoyisgcuiik`)\
**Production project:** `clockitt` (`pzecbhlnpufcbdchvzwr`) — Singapore\
**Verdict:** ✅ **GO**

---

## 1. Migration Files Inventory

| File | Size | Last Modified | Status |
|---|---|---|---|
| `0001_init.sql` | 14,426 B | 2026-11-10 | ✅ Ready |
| `0002_user_personalization.sql` | 4,075 B | 2026-11-11 | ✅ Ready |
| `0003_atomic_quick_notes.sql` | 3,018 B | 2026-11-12 | ✅ Ready |

---

## 2. Execution Order & Dependency Analysis

```
0001_init.sql
  └─ Creates all 11 clockit_* tables
  └─ Creates clockit_set_updated_at() trigger function
  └─ Creates clockit_handle_new_user() trigger function (v1)
  └─ Creates clockit_on_auth_user_created trigger on auth.users
  └─ Enables RLS on all 11 tables
  └─ Creates all indexes

0002_user_personalization.sql  (depends on 0001)
  └─ ALTER TABLE clockit_user_preferences ADD COLUMN ×5
  └─ Replaces clockit_handle_new_user() with improved v2
  └─ Re-registers clockit_on_auth_user_created trigger
  └─ Re-asserts RLS on clockit_user_preferences

0003_atomic_quick_notes.sql  (depends on 0001)
  └─ Creates clockit_replace_quick_notes(jsonb) RPC function
  └─ GRANT EXECUTE to authenticated
  └─ REVOKE EXECUTE from anon, public
```

**Order verdict:** ✅ Correct. 0001 must run first. 0002 and 0003 may run in any order after 0001 since they do not depend on each other.

---

## 3. Table Coverage Verification

### Tables declared in `0001_init.sql`

| Table | Created | RLS Enabled | RLS Forced | updated_at trigger |
|---|---|---|---|---|
| `clockit_profiles` | ✅ | ✅ | ✅ | ✅ |
| `clockit_workspaces` | ✅ | ✅ | ✅ | ✅ |
| `clockit_tasks` | ✅ | ✅ | ✅ | ✅ |
| `clockit_focus_sessions` | ✅ | ✅ | ✅ | ❌ (no updated_at column) |
| `clockit_habits` | ✅ | ✅ | ✅ | ✅ |
| `clockit_calendar_events` | ✅ | ✅ | ✅ | ✅ |
| `clockit_timeline_events` | ✅ | ✅ | ✅ | ✅ |
| `clockit_notes` | ✅ | ✅ | ✅ | ✅ |
| `clockit_note_folders` | ✅ | ✅ | ✅ | ✅ |
| `clockit_quick_notes` | ✅ | ✅ | ✅ | ❌ (no updated_at column — by design) |
| `clockit_user_preferences` | ✅ | ✅ | ✅ | ✅ |

> [!NOTE]
> `clockit_focus_sessions` and `clockit_quick_notes` intentionally omit `updated_at` columns (focus sessions are immutable records; quick notes are always fully replaced). This is correct — the `updated_at` trigger loop in 0001 only iterates the 9 tables that have that column.

**Total: 11/11 tables** covered. ✅

### Tables added by `0002_user_personalization.sql`

No new tables. Adds 5 columns to `clockit_user_preferences`:

| Column | Type | Default | Nullable |
|---|---|---|---|
| `onboarding_completed` | boolean | false | NO |
| `productivity_challenges` | text[] | '{}' | NO |
| `planning_preference` | text | — | YES |
| `preferred_focus_duration` | integer | 25 | NO |
| `appearance_preference` | text | 'system' | NO |

All use `ADD COLUMN IF NOT EXISTS`. ✅ Idempotent.

---

## 4. RLS Policy Review

### Policy pattern (applied to all 11 tables in `0001`)

```sql
CREATE POLICY "ClockIt users manage their own rows" ON public.<table>
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

| Check | Result |
|---|---|
| `USING` clause enforces row-level read isolation | ✅ PASS |
| `WITH CHECK` blocks cross-user writes | ✅ PASS |
| Restricted to `authenticated` role only | ✅ PASS |
| No `anon` or `public` access | ✅ PASS |
| `FORCE ROW LEVEL SECURITY` applied | ✅ PASS — prevents bypasses even by table owner |
| Policy uses `DROP POLICY IF EXISTS` before creation | ✅ PASS — idempotent |
| Café tables untouched | ✅ PASS — no café table in policy loop |

**RLS verdict:** ✅ Strong. All 11 tables are owner-isolated and service-role-safe.

---

## 5. Functions & Triggers Verification

### `clockit_set_updated_at()`

- Type: BEFORE UPDATE trigger function
- Sets `NEW.updated_at = NOW()`
- Installed on 9 tables (all with `updated_at` columns)
- Uses `DROP TRIGGER IF EXISTS` before creation — idempotent ✅

### `clockit_handle_new_user()` (v2 from 0002)

- Type: AFTER INSERT trigger on `auth.users`
- `security definer`, `set search_path = ''` — no schema injection risk ✅
- Inserts into `clockit_profiles` and `clockit_user_preferences`
- Uses `ON CONFLICT (user_id) DO NOTHING` / `DO UPDATE` — idempotent ✅
- **v2 improvement (0002):** Falls back to `'ClockIt user'` instead of email prefix
- Conflict update on profiles is conditional — preserves a user's existing name unless it was empty, the default string, or an old email-prefix fallback ✅
- Trigger name `clockit_on_auth_user_created` is prefixed — does not conflict with any café trigger ✅
- Uses `DROP TRIGGER IF EXISTS` before creation ✅

### `clockit_replace_quick_notes(p_notes jsonb)` (0003)

- Type: RPC function (`SECURITY DEFINER`, `set search_path = ''`)
- Verifies `auth.uid()` at function entry — raises exception if `NULL` ✅
- Validates `p_notes` is a JSON array ✅
- DELETE + INSERT runs within the same PL/pgSQL function body — PostgreSQL wraps this in an implicit transaction (the RPC call is atomic) ✅
- `GRANT EXECUTE ... TO authenticated` / `REVOKE ... FROM anon, public` ✅
- Accepts both `{"body": "...", "client_id": "..."}` objects and raw strings ✅

---

## 6. Quick Notes Atomic RPC — syncEngine.ts Compatibility

### RPC call in `syncEngine.ts` (line 170)

```typescript
const { error: rpcError } = await supabase.rpc('clockit_replace_quick_notes', {
  p_notes: notePayload,
});
```

Where `notePayload` is:
```typescript
op.notes.map((body, index) => ({
  body,
  client_id: `qn-${index}-${body.length}-${body.slice(0, 16)}`,
  sort_index: index,
}))
```

### Compatibility matrix

| Check | SQL expectation | TypeScript sends | Result |
|---|---|---|---|
| Function name | `clockit_replace_quick_notes` | `'clockit_replace_quick_notes'` | ✅ MATCH |
| Param name | `p_notes jsonb` | `{ p_notes: notePayload }` | ✅ MATCH |
| Input format | JSON array of objects with `body` / `client_id` | Array of `{body, client_id, sort_index}` | ✅ MATCH |
| `body` field | `v_note.elem->>'body'` | `body: string` | ✅ MATCH |
| `client_id` field | `v_note.elem->>'client_id'` | `client_id: string` | ✅ MATCH |
| Extra `sort_index` field in payload | Ignored by SQL (not read from JSON) | Provided | ✅ No error |
| Auth enforcement | `auth.uid()` checked first | Supabase JWT in request | ✅ Enforced |
| Fallback if RPC missing | Upsert-first + trim-surplus | Executed on `rpcError` | ✅ Safe |

> [!NOTE]
> The SQL function assigns its own `sort_index` from an internal counter (`v_index`). The `sort_index` field sent in the TypeScript payload is **ignored** by the SQL — the final order is determined by the JSON array order. This is consistent with how `hydrateQuickNotes` reads back rows ordered by `sort_index ASC`. ✅

**Quick Notes RPC verdict:** ✅ Fully compatible.

---

## 7. Destructive SQL, Café Dependencies & Safety Checks

### Destructive SQL

| Pattern checked | Findings |
|---|---|
| `DROP TABLE` | ❌ None |
| `TRUNCATE` | ❌ None |
| `ALTER TABLE ... DROP COLUMN` | ❌ None |
| `DELETE FROM` (migration-time) | ⚠️ One — inside `clockit_replace_quick_notes()` body |
| `DROP TRIGGER IF EXISTS` | ✅ Expected — precedes every `CREATE TRIGGER` |
| `DROP POLICY IF EXISTS` | ✅ Expected — precedes every `CREATE POLICY` |

**The single `DELETE FROM clockit_quick_notes`** is inside the RPC function body — it only executes at runtime when the RPC is called, not during migration execution. The `WHERE user_id = v_user_id` clause is enforced, and it runs within a transaction. ✅ Not a migration-time risk.

### Café dependency check

| Object pattern | In migrations | Result |
|---|---|---|
| `cafes`, `favorites`, `menu_items`, `profiles`, `reviews` | ❌ Not referenced | ✅ PASS |
| Café trigger modified or dropped | ❌ | ✅ PASS |
| `public.profiles` referenced | ❌ | ✅ PASS |
| Non-prefixed function names | ❌ — all use `clockit_` prefix | ✅ PASS |

**Production note:** The `clockitt` Supabase project contains **no café application**. Even so, coexistence guards are in place and would be safe if the project were ever shared.

### Idempotency

| Migration | Tables | Functions | Triggers | Policies | Indexes |
|---|---|---|---|---|---|
| `0001_init.sql` | `IF NOT EXISTS` ✅ | `CREATE OR REPLACE` ✅ | `DROP IF EXISTS` before each ✅ | `DROP IF EXISTS` before each ✅ | `IF NOT EXISTS` ✅ |
| `0002_user_personalization.sql` | n/a | `CREATE OR REPLACE` ✅ | `DROP IF EXISTS` before ✅ | n/a | n/a |
| `0003_atomic_quick_notes.sql` | n/a | `CREATE OR REPLACE` ✅ | n/a | n/a | n/a |

**All three migrations are safe to re-run.** ✅

### Duplicate object risk

None. Every object creation is guarded by either `IF NOT EXISTS`, `CREATE OR REPLACE`, or a preceding `DROP ... IF EXISTS`. ✅

---

## 8. Missing Index Assessment

### Existing indexes (declared in `0001`)

| Index | Columns | Purpose |
|---|---|---|
| `clockit_workspaces_user_idx` | `(user_id)` | workspace listing |
| `clockit_tasks_user_idx` | `(user_id)` | task listing |
| `clockit_tasks_user_due_idx` | `(user_id, due_date)` | due date filtering |
| `clockit_focus_user_idx` | `(user_id)` | focus session listing |
| `clockit_focus_user_completed_idx` | `(user_id, completed_at DESC)` | analytics timeline |
| `clockit_habits_user_idx` | `(user_id)` | habit listing |
| `clockit_cal_user_day_idx` | `(user_id, day)` | calendar day lookup |
| `clockit_timeline_user_idx` | `(user_id)` | timeline listing |
| `clockit_notes_user_idx` | `(user_id)` | notes listing |
| `clockit_notes_user_folder_idx` | `(user_id, folder_id)` | folder filtering |
| `clockit_notes_user_updated_idx` | `(user_id, updated_at DESC)` | recently updated |
| `clockit_note_folders_user_idx` | `(user_id)` | folder listing |
| `clockit_quick_notes_user_idx` | `(user_id, sort_index)` | ordered note fetch |

**All hot query paths are indexed.** No missing indexes identified. ✅

> [!TIP]
> `clockit_profiles` has no secondary index beyond its PK and unique constraint on `user_id`. All profile lookups are by `user_id` (which has a unique index), so no additional index is needed.

---

## 9. Project Reference Isolation Check

### Source code

No hardcoded Supabase project references found anywhere in `src/`:

| Searched pattern | Result |
|---|---|
| `gynycspbhfoyisgcuiik` (nook ref) | ❌ Not found in `src/` |
| `pzecbhlnpufcbdchvzwr` (clockitt ref) | ❌ Not found in `src/` |
| `supabase.co` hardcoded URL | ❌ Not found in `src/` |

The Supabase client reads **only** from `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`. ✅

### Environment variable routing

| Build environment | URL source | Points to |
|---|---|---|
| Local dev (`npm run dev`) | `.env` | `nook` (gynycspbhfoyisgcuiik) |
| Vercel Production | Vercel project env vars | `clockitt` (pzecbhlnpufcbdchvzwr) |

The two environments are **completely isolated** at the env-var level. A production build can never accidentally connect to `nook`. ✅

---

## 10. Application Code Compatibility with Production Schema

### TABLES constant in `mappers.ts`

```typescript
export const TABLES = {
  profiles:        'clockit_profiles',
  workspaces:      'clockit_workspaces',
  tasks:           'clockit_tasks',
  focusSessions:   'clockit_focus_sessions',
  habits:          'clockit_habits',
  calendarEvents:  'clockit_calendar_events',
  timelineEvents:  'clockit_timeline_events',
  notes:           'clockit_notes',
  noteFolders:     'clockit_note_folders',
  quickNotes:      'clockit_quick_notes',
  userPreferences: 'clockit_user_preferences',
} as const;
```

All 11 table names match the migration schema exactly. ✅

### Domain coverage in `entityDomains`

The sync engine's `entityDomains` array (used for hydrate loop) contains:

| Domain | Table |
|---|---|
| `taskDomain` | `clockit_tasks` |
| `workspaceDomain` | `clockit_workspaces` |
| `focusDomain` | `clockit_focus_sessions` |
| `habitDomain` | `clockit_habits` |
| `calendarDomain` | `clockit_calendar_events` |
| `timelineDomain` | `clockit_timeline_events` |
| `noteDomain` | `clockit_notes` |
| `noteFolderDomain` | `clockit_note_folders` |

`clockit_profiles`, `clockit_quick_notes`, and `clockit_user_preferences` are handled by dedicated hydration paths (`hydratePreferences()`, `hydrateQuickNotes()`), not the generic loop. ✅

### Preference columns — code vs. schema alignment

All 5 columns added by `0002` are fully implemented in `preferencesRepository.ts`:

| Column (SQL) | Property (TypeScript) | ✅ |
|---|---|---|
| `onboarding_completed` | `onboardingCompleted` | ✅ |
| `productivity_challenges` | `productivityChallenges` | ✅ |
| `planning_preference` | `planningPreference` | ✅ |
| `preferred_focus_duration` | `preferredFocusDuration` | ✅ |
| `appearance_preference` | `appearancePreference` | ✅ |

---

## 11. Build & Type Check Results

```
npm run typecheck
> tsc --noEmit
Exit code: 0 — ZERO type errors ✅

npm run build
> vite build

Chunk                              Size       Gzip
------                             ----       ----
index.js (app entrypoint)          223.02 kB  56.30 kB
vendor-editor (TipTap)             455.73 kB  144.76 kB  ← largest chunk, below 600 kB limit
vendor-react                       262.65 kB  83.32 kB
vendor-supabase                    228.75 kB  59.50 kB
vendor-gsap                        114.87 kB  45.46 kB
vendor-icons                        48.04 kB  9.81 kB
index.css                           93.47 kB  15.08 kB

Exit code: 0 — ZERO warnings ✅ — built in 4.61s
```

> [!IMPORTANT]
> Zero Vite chunk-size warnings. The 600 kB `chunkSizeWarningLimit` threshold is not breached by any single chunk. The build is production-ready.

---

## 12. Vercel Deployment Configuration

| File | Config | Status |
|---|---|---|
| `vercel.json` | SPA rewrite: `/*` → `/index.html` | ✅ Present |
| `public/_redirects` | `/* /index.html 200` (Netlify/CF fallback) | ✅ Present |
| Vercel env vars | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` scoped to Production | ✅ Configured (per user) |

All routes (including nested routes, direct URL access, and browser refresh) will work correctly on Vercel. ✅

---

## 13. Pre-Execution Checklist

Before running migrations on `clockitt`:

- [ ] Log into the `clockitt` Supabase Dashboard (not `nook`)
- [ ] Confirm the project URL shows `pzecbhlnpufcbdchvzwr.supabase.co`
- [ ] Open **SQL Editor** in the `clockitt` dashboard
- [ ] Run `0001_init.sql` → verify "Success" with no errors
- [ ] Run `0002_user_personalization.sql` → verify "Success"
- [ ] Run `0003_atomic_quick_notes.sql` → verify "Success"
- [ ] Confirm in **Table Editor** that all 11 `clockit_*` tables exist
- [ ] Confirm in **Authentication → Triggers** that `clockit_on_auth_user_created` appears
- [ ] Confirm in **Database → Functions** that all three ClockIt functions exist
- [ ] Confirm RLS is active on all 11 tables (**Database → Tables → RLS**)
- [ ] Create a test account via Supabase Auth and verify `clockit_profiles` and `clockit_user_preferences` rows were auto-created
- [ ] Deploy the application via Vercel (or trigger a redeploy to pick up the new env vars)
- [ ] Sign up on the production URL and verify cloud sync is active

---

## 14. Summary

| Area | Status | Notes |
|---|---|---|
| Migration files present | ✅ PASS | All 3 files found |
| Execution order | ✅ PASS | 0001 → 0002/0003 |
| All 11 tables covered | ✅ PASS | Exact match |
| RLS on all tables | ✅ PASS | Enabled + forced |
| No café dependencies | ✅ PASS | Zero references |
| No destructive migration SQL | ✅ PASS | No DROP TABLE, TRUNCATE |
| Idempotency | ✅ PASS | All migrations safe to re-run |
| Trigger safety | ✅ PASS | All preceded by DROP IF EXISTS |
| Quick Notes RPC compatibility | ✅ PASS | Exact param/field match |
| Hardcoded project refs in src/ | ✅ PASS | None found |
| Env var isolation (dev vs. prod) | ✅ PASS | Fully separated |
| TypeScript type check | ✅ PASS | 0 errors |
| Production build | ✅ PASS | 0 warnings, 4.61s |
| Vercel SPA routing | ✅ PASS | rewrite + _redirects present |

---

## ✅ GO — CLEARED FOR PRODUCTION MIGRATION

All preflight checks pass. The three migrations are safe to execute on the `clockitt` production project (`pzecbhlnpufcbdchvzwr`) in order: **0001 → 0002 → 0003**.

No application code changes are required. No env file changes are required. The application build is production-ready.

**Next action:** Execute migrations on `clockitt` via the Supabase SQL Editor, then deploy to Vercel.

---

*Preflight performed in read-only mode. No files were modified. No SQL was executed. No deployments were made.*
