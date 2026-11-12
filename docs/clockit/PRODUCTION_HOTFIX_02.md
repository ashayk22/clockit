# Production Stabilization — Hotfix 02

## Root causes

- Repositories used the demo fixture arrays from `mockData.ts` as real-account local-storage defaults. An empty browser cache therefore started with habits, focus sessions, calendar items, timeline entries, tasks, workspaces, and quick notes.
- Cloud hydration populated empty collections with `initialRecords`. This caused seeded activity to be written to a new account even when Supabase correctly returned no rows.
- Habit calendar history was a fixed October fixture, independent of the signed-in user's habit records. This produced the 75% consistency, perfect-day count, and historical chart/calendar display.
- Empty quick-note cloud results were converted into a generated welcome note instead of remaining empty.
- Demo Mode itself is explicitly populated through `demoService`; it does not need repositories to carry fixture defaults.

## Final security and regression audit

### Account isolation findings

- **Account-owned local cache: not implemented.** Task, habit, focus, calendar, timeline, quick-note, and preference storage keys are shared across signed-in users. Record-level `userId` is not used by repository reads to filter these shared local collections.
- **Real user A → sign out → real user B:** `stopCloudSync()` resets most local repository collections, which usually prevents those records from appearing to B. Its note and folder clears are fire-and-forget IndexedDB writes, though, and B's empty cloud hydration does not clear the IndexedDB stores. That leaves a race and a confirmed stale-note/folder exposure path.
- **Demo → real user:** `clearDemoData()` clears local-storage fixture collections but does not clear IndexedDB notes or folders. An empty cloud result leaves those stores as-is. Demo sample notes/folders can therefore remain visible to the real account.
- **Real user → Demo:** `loadDemoData()` replaces local-storage collections but does not replace IndexedDB notes/folders. Real-user notes/folders can remain visible in Demo Mode.
- **Sign out → same user:** repository caches are reset. A queued operation may replay to that same user's cloud account, but the corresponding local snapshot is not retained; for a table with queued changes, hydration skips replacing local data, leaving the reset local collection empty. The user's local view can lose work until another reload/hydration, even where the queue eventually syncs it.
- **Offline queue ownership:** `clockit-sync-queue` is one global key with a single owner field. `loadQueue()` refuses to load a queue whose owner differs, so the current guard prevents ordinary replay of A's queue under B. However, B's next `persistQueue()` overwrites A's stored queue. Pending A work can be lost. The operation payload's `user_id` is not independently checked against the active user before upsert.
- **Empty cloud collections:** task/habit/focus/calendar/timeline hydration writes only when rows are non-empty. Empty results therefore do not clear the shared local cache. This preserves offline work, but is unsafe without per-account cache ownership. The previous empty-result behavior also inserted a welcome quick note and a default Personal workspace.

**Assessment:** the new-user empty-statistics fix is incomplete as a multi-account privacy fix. Demo and real notes can cross modes/accounts; offline state can be lost; and local account ownership is not enforced. A safe repair needs account-scoped cache snapshots (including IndexedDB notes/folders and preferences), per-user durable queues, and a transition protocol that captures pending local changes before switching the shared working cache. Do not resolve this by clearing arbitrary local collections.

### Could mock records already be in production?

I inspected the repository's committed `HEAD` sync mapper and hydration behavior without contacting Supabase. At that revision, `initialRecords()` for tasks, habits, focus sessions, calendar events, timeline events, notes, and note folders returned empty arrays; only the default Personal workspace was seeded. Therefore, the inspected cloud hydration path would not automatically upsert the task/habit/focus/calendar fixture arrays. The note fixtures are seeded in local IndexedDB by `notesStorage.init()`, but the sync path attempted to replace that store with the cloud rows during hydration. The earlier empty quick-note path could write the generic welcome note. This is source-based evidence, not a production database verification; prior deployed revisions or other application paths may differ.

No production database query was run. Use this read-only procedure for each production test account:

1. In Supabase Dashboard → Authentication → Users, copy the exact test account UUID. Do not use email as a substitute for the owner filter.
2. In the production SQL Editor, run only `SELECT` queries filtered by that UUID. Example fixture checks:

```sql
select client_id, title, created_at
from public.clockit_tasks
where user_id = '<AUTH_USER_UUID>'::uuid
  and client_id in ('t-1','t-2','t-3','t-4','t-5','t-6','t-7','t-8','t-9','t-10','t-11');

select client_id, title
from public.clockit_habits
where user_id = '<AUTH_USER_UUID>'::uuid
  and client_id in ('h-1','h-2','h-3','h-4','h-5','h-6','h-7','h-8');

select client_id, task_title, completed_at
from public.clockit_focus_sessions
where user_id = '<AUTH_USER_UUID>'::uuid
  and client_id in ('fs-seed-1','fs-seed-2','fs-seed-3','fs-seed-4','fs-seed-5');

select client_id, title
from public.clockit_calendar_events
where user_id = '<AUTH_USER_UUID>'::uuid
  and client_id in ('ce-1','ce-2','ce-3','ce-4','ce-5','ce-6','ce-7','ce-8','ce-9','ce-10','ce-11','ce-12');

select client_id, title
from public.clockit_notes
where user_id = '<AUTH_USER_UUID>'::uuid
  and client_id in ('n-clockit-features','n-ui-ideas','n-tech-stack','n-task-management','n-habit-tracker','n-release-plan');

select client_id, name
from public.clockit_note_folders
where user_id = '<AUTH_USER_UUID>'::uuid
  and client_id in ('f-personal','f-personal-ideas','f-personal-goals','f-personal-journal','f-dev','f-dev-webdev','f-dev-projects','f-dev-resources','f-college','f-freelance');

select client_id, body
from public.clockit_quick_notes
where user_id = '<AUTH_USER_UUID>'::uuid
  and body = 'Welcome to ClockIt! Capture quick thoughts here.';
```

These queries are account-specific and read-only. Review returned rows with the account owner before deciding whether any are test fixtures. Do not delete or bulk-clean records as part of this audit.

### Mobile browser audit

- The mobile audit was retried with a newly created temporary Puppeteer `userDataDir`; Chrome still failed before opening a page. The process emitted `ERROR: The user name or password is incorrect` and Puppeteer reported launch code `2147483651` / a locked temporary profile. No existing Chrome profile was selected or intentionally closed.
- **No browser viewport tests actually ran.** Horizontal overflow, card/chart/calendar dimensions, modal sizing, mobile navigation, and scroll behavior at 320, 360, 375, 393, and 430 px remain unverified. Static CSS review is not a substitute for these measurements.

## Files modified

- `src/services/cloud/syncEngine.ts`
- `src/auth/AuthContext.tsx`
- `src/demo/demoService.ts`
- `src/services/dataService.ts`
- `src/services/repositories/calendarRepository.ts`
- `src/services/repositories/focusRepository.ts`
- `src/services/repositories/habitRepository.ts`
- `src/services/repositories/notesRepository.ts`
- `src/services/repositories/taskRepository.ts`
- `src/services/repositories/workspaceRepository.ts`

## Fixes implemented

- Real repository defaults are now empty. Demo Mode continues loading its fixture data explicitly through `demoService` and `demoData`.
- Cloud hydration no longer seeds `initialRecords` into empty server collections. Non-empty cloud results still hydrate local data; empty responses leave local records intact to protect unsynced offline work.
- Switching directly from Demo Mode to a real sign-in or sign-up explicitly clears the demo fixture records. Signing out of demo does the same. The clear operation is limited to the known demo session and does not remove cloud data.
- The fixed sample habit calendar history is no longer returned for real accounts. No historical completions are invented because the current schema stores habit state and streak, not per-day completion records.
- Demo Mode still receives its sample habit calendar explicitly; its sample record fixtures remain in `demoData`.
- Empty quick-note results now hydrate as an empty list, without injecting a welcome note.
- No schema, credentials, production SQL, deployment, or existing user records were changed.

## Regression verification

- `npm run typecheck` — passed.
- `npm run build` — passed.
- `scripts/test-phase13-2-reliability.mjs` — 3 static checks passed; browser portion blocked before page load because Puppeteer reported a running temporary profile.
- `scripts/test-phase13-3-auth-privacy.mjs` — password-validation check passed; browser portion blocked before page load for the same launch issue.
- `scripts/test-phase13-4-perf-a11y.mjs` — bundle-size assertion passed (largest JS chunk 445.05 kB, under its 500 kB threshold). Browser checks blocked before page load for the same launch issue.
- `scripts/test-hotfix-01-onboarding.mjs` — blocked before test execution by Chrome launch code `2147483651`.
- `scripts/test-phase12-4-qa.mjs` — 7 checks passed; 1 failed because the tutorial inventory is missing `note_folders` and `preferences` walkthroughs. This is a static QA failure, not caused by browser launch.
- `scripts/test-phase12-4-onboarding.mjs` — passed.
- `scripts/test-engine.mjs` — blocked before test execution because it imports missing `src/pomodoro.js`.
- `scripts/audit_mobile.mjs` and the isolated-profile retry — blocked before page load. The fresh temporary profile attempt emitted `ERROR: The user name or password is incorrect` and Chrome launch code `2147483651`. No browser measurements were collected.
- `scripts/test-phase12-3-browser-qa.mjs` was not run because it uses Supabase clients and contains cloud table operations; the instruction prohibited modifying Supabase or production data.
- Puppeteer suites listed above did not complete browser assertions and are not counted as passed. Their browser portions remain unverified in this environment.
- `git diff --check` — passed.

## Responsive review and remaining issues

- Source review found existing narrow-screen KPI reflow (four to two to one columns), chart collapse, wrapping page headers, and safe-area padding for the fixed mobile navigation and page viewport. The mobile nav also constrains labels to available width.
- Because browser automation could not launch, horizontal overflow, actual card/chart/calendar dimensions, modal fit, and text wrapping were not measured at the requested widths.
- Historical per-day habit analytics remain unavailable until the product records dated habit completions. They now show no historical activity when there are no such records, rather than sample statistics.
- Account isolation and IndexedDB fixture seeding remain release blockers.
- The separate untracked `scripts/audit_mobile.mjs` was present before this work and was left unchanged.

## Recommendation

**NO-DEPLOY.** Resolve the account-scoped cache/queue and IndexedDB notes isolation issues, then rerun multi-account transition tests and the mobile browser matrix. The current typecheck/build success does not clear the privacy and offline-data blockers.
