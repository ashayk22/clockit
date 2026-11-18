# Production Hotfix 03 — Account Isolation and Offline Sync

## Assessment

**PARTIAL — Browser integration verification remains incomplete. NO-DEPLOY.**

The code now separates normal local repositories, preferences, timer state, onboarding state, notes/folders, demo fixtures, and queued cloud operations by stable owner identifiers. Account transition code suspends the old sync engine before switching the repository view. The implementation passed TypeScript and production-build checks and the new local owner-scope regression script.

Deployment is not recommended yet. Browser-based account-switch, IndexedDB, and live offline-replay integration tests could not run because Puppeteer Chrome failed to launch in this environment. The old unscoped local caches and old shared IndexedDB database are retained but quarantined from all new owner scopes; their contents need account-specific recovery review before any migration. This report makes no claim about production records, which were not queried or modified.

## Root causes found

- Local JSON repositories used shared, unscoped LocalStorage keys and retained one in-memory collection across identity changes.
- User preferences and several direct UI keys (timer and onboarding state) were also unscoped.
- Notes and folders used a single IndexedDB database whose records had no enforced owner boundary; initialization could seed sample notes into any account.
- The offline queue used one global key. Loading another account could overwrite the first account's pending operations, and replay did not validate each operation owner.
- Sync stop reset shared repository caches, while debounced scans and in-flight hydration could race account transitions.
- Legacy cache data does not carry a reliable owner. Automatically assigning it to the next authenticated account would risk cross-account disclosure.

## Architecture changes

- Added an active storage-owner context. Real users use `user:<auth UUID>`, Demo Mode uses `demo`, and signed-out local state uses `local`.
- Local JSON repository keys now use `clockit:owner:<encoded owner>:<old key>`. Repository state refreshes on owner changes; preferences use the same owner namespace.
- Demo fixtures are written only in the Demo namespace. Demo transitions no longer clear another namespace's cache.
- Timer settings, active timer state, onboarding progress, and cloud hydration writes use owner-scoped keys.
- Notes and folders are written to separate IndexedDB databases named for the owner. Note and folder records carry `userId`; reads and mutations validate it. Real-user initialization does not seed fixtures. Demo initialization seeds its own sample notes.
- Existing `clockit-notes-db` data is left untouched. It is no longer used by the new owner-scoped implementation because the old rows do not identify their owner.
- Queue keys are per authenticated UUID. Operations retain `ownerId`; upserts validate `payload.user_id`, deletes filter by the captured owner, and replay stops if the active owner or queue changes. A legacy global queue is adopted only when its recorded `userId` exactly matches the signing-in UUID; its original key is retained.
- Local edits mark their owner's cache dirty immediately. Per-owner sync baselines are persisted so a switch before the delayed scan can later detect additions, updates, and deletions without letting another account's hydration overwrite that cache.
- Cloud hydration checks the active owner after awaits and validates returned `user_id` values before writing.

## Storage migration and safety

- No database schema change or production SQL was made.
- No Supabase data, credentials, pending operations, or LocalStorage values were deleted.
- Existing unscoped LocalStorage records remain under their original keys and are not imported into any owner namespace. The legacy global queue is only copied to an owner queue when its recorded owner matches. Invalid owner-tagged queue data is copied to a quarantine key before the normal queue is rewritten.
- The legacy shared IndexedDB database remains intact and unused by the new code. No automatic owner assignment is safe for its unowned notes and folders.
- Recovery of pre-Hotfix local cache and IndexedDB records requires read-only inspection with the user and an explicit owner mapping. No automatic migration is included.
- Rollback: the prior application can still read its old LocalStorage keys and old `clockit-notes-db`. New owner-scoped keys/databases are additive and remain intact if the code is rolled back. Do not delete either set during rollback.

## Files changed

- `src/services/repositories/storage.ts`
- `src/services/repositories/index.ts`
- `src/services/repositories/taskRepository.ts`
- `src/services/repositories/habitRepository.ts`
- `src/services/repositories/focusRepository.ts`
- `src/services/repositories/calendarRepository.ts`
- `src/services/repositories/workspaceRepository.ts`
- `src/services/repositories/preferencesRepository.ts`
- `src/services/repositories/notesRepository.ts`
- `src/services/notesStorage.ts`
- `src/services/cloud/mappers.ts`
- `src/services/cloud/syncEngine.ts`
- `src/auth/AuthContext.tsx`
- `src/demo/demoService.ts`
- `src/services/onboardingService.ts`
- `src/components/onboarding/OnboardingWizard.tsx`
- `src/components/pages/FocusPage.tsx`
- `src/components/common/ErrorBoundary.tsx`
- `scripts/test-hotfix-03-isolation.mjs`

## Tests and verification

- `npm run typecheck` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.
- `node scripts/test-hotfix-03-isolation.mjs` — passed. Exercises LocalStorage owner-key isolation across Demo → real, A → B → A, signed-out → sign-in, and reload; checks queue, IndexedDB, and auth owner guards in source. It is a local unit/source-guard test, not a live browser integration test.
- `node scripts/test-hotfix-03-browser-smoke.mjs` — attempted with a newly created temporary user-data directory. Blocked before opening a page: Puppeteer said the browser was already running for that new directory; Windows emitted `ERROR: The user name or password is incorrect`. The temporary directory was removed by the test. No existing Chrome profile was opened or modified.
- `scripts/test-phase12-4-onboarding.mjs` — passed.
- `scripts/test-phase12-4-qa.mjs` — passed, 8/8 checks. The corrected inventory covers the actual 11 product-area tours and existing Notes folders and Settings personalization steps.
- `scripts/test-phase13-2-reliability.mjs` — 3 static checks passed; browser assertions blocked before page load because Puppeteer reported a locked/running temporary profile and Windows emitted `The user name or password is incorrect`.
- `scripts/test-phase13-3-auth-privacy.mjs` — password-validation check passed; browser assertions blocked by the same Puppeteer launch failure.
- `scripts/test-phase13-4-perf-a11y.mjs` — bundle-size assertion passed (445.05 kB maximum under its 500 kB threshold); browser assertions blocked by Puppeteer launch failure.
- `scripts/test-hotfix-01-onboarding.mjs` — blocked before test assertions by Chrome launch code `2147483651`.
- No real IndexedDB integration test, live auth transition, Supabase replay, or browser account-switch test ran. No production data inspection was performed.

## Remaining risks and blockers

- Required real-browser scenarios A–G still need execution in an environment where isolated Puppeteer profiles can launch. The new regression test does not simulate actual Supabase auth, IndexedDB transactions, or network replay.
- Existing unscoped local records and old IndexedDB notes cannot be safely attributed to an account automatically. They remain preserved but unavailable in the new owner namespaces pending a reviewed recovery plan.
- During a dirty local state, cloud hydration preserves the owner cache so pending edits/deletions cannot be overwritten. That can temporarily omit remote changes from another device until a later clean hydration; this needs browser-level synchronization testing.
- The landing page's responsive overflow, navigation and browser console have not been checked in a browser.

## Legacy data recovery review

Legacy LocalStorage values and the original `clockit-notes-db` were re-reviewed without opening or changing production data. Their records do not include a dependable auth UUID. Timestamps, folder names, note titles and a browser's current auth session are not sufficient proof of ownership when the browser may have been used by multiple accounts.

Safe recovery process:

1. Make a byte-preserving browser-profile backup before any recovery work. Export the old LocalStorage keys and both IndexedDB object stores to a read-only JSON archive; record database names, store names and export time. Keep the source profile unchanged.
2. Inventory records by ID, title, timestamps, folder relationships, content and cross-references. Do not infer an owner from whichever account is currently signed in.
3. Ask the device owner to map each record (or an unambiguous group) to a specific account or to `local`/Demo. Anything they cannot confidently attribute remains quarantined and is not imported.
4. Prepare an import preview and a signed-off mapping manifest (`legacy record ID -> explicit owner ID`). Check duplicate IDs, orphan folder references and note links before writing.
5. Import a copy into that owner's existing scoped database/cache. Preserve original IDs where safe; otherwise retain an ID mapping for relationships. Keep the source archive and import manifest for rollback.
6. For authenticated owners, review the imported local records before enabling sync so the expected upserts can be inspected. No cloud upload or production write is part of this Hotfix.

Rollback is to restore the backed-up scoped stores and continue to retain the untouched legacy database/keys. Never delete the archive or legacy source as part of migration. If ownership is ambiguous, leave that content quarantined and offer manual copy/export rather than assigning it automatically.

## Focus Notes repair

- The focus panel was only a disabled visual placeholder; it had no TipTap instance, note selection, repository calls, or save-state handling.
- Focus now uses the existing `NotesEditor`, note/folder repositories and owner-specific IndexedDB database. It can select existing notes, create regular/session notes, edit titles and rich content, and save through the existing repository path.
- The editor flushes pending autosave content when switching notes or unmounting. Focus content drafts are owner-scoped in LocalStorage, restored with a visible failed-save state, and can be retried. Owner-explicit IndexedDB updates let a pending A save finish in A's database after the active owner changes; it cannot write into B's database.
- A successful authenticated local note write marks that owner's sync cache dirty and triggers the existing cloud scan when that owner is active. Offline content remains in IndexedDB and is queued when synchronization resumes.
- Focus Notes lifecycle tests could not run in a browser here. TypeScript/build verification covers the component integration, but create/edit/reload/offline/account-switch behavior remains unverified end to end.

## Tutorial inventory resolution

The prior QA script expected `note_folders` and `preferences` as top-level tour IDs, but the actual product tour has 11 top-level areas, including `notes` and `settings`. Notes already contains a `notes-folders` step, and Settings contains a `settings-personalization` step. The product tour definitions were not missing; the inventory test was outdated. The QA script now checks the 11 actual tour IDs and separately verifies those two subtopic steps. No fake tutorial was added.

## Homepage update

The public homepage was replaced with personal productivity positioning and no longer renders enterprise sprint-tracker copy. Section details and content review are in `docs/clockit/HOMEPAGE_REDESIGN.md`. Browser navigation, responsive overflow and console checks could not run because the isolated Puppeteer profile launch failed before opening a page.

## Combined Hotfix 03 and requested-work file inventory

Modified or added:

- `src/auth/AuthContext.tsx`
- `src/components/common/ErrorBoundary.tsx`
- `src/components/focus/FocusNotesPanel.tsx`
- `src/components/focus/FocusWorkspacePresentation.tsx`
- `src/components/focus/focus-workspace.css`
- `src/components/notes/NotesEditor.tsx`
- `src/components/onboarding/OnboardingWizard.tsx`
- `src/components/pages/FocusPage.tsx`
- `src/demo/demoService.ts`
- `src/landing/LandingPage.tsx`
- `src/landing/public-home.css`
- `src/services/cloud/index.ts`
- `src/services/cloud/mappers.ts`
- `src/services/cloud/syncEngine.ts`
- `src/services/notesStorage.ts`
- `src/services/onboardingService.ts`
- `src/services/repositories/calendarRepository.ts`
- `src/services/repositories/focusRepository.ts`
- `src/services/repositories/habitRepository.ts`
- `src/services/repositories/index.ts`
- `src/services/repositories/notesRepository.ts`
- `src/services/repositories/preferencesRepository.ts`
- `src/services/repositories/storage.ts`
- `src/services/repositories/taskRepository.ts`
- `src/services/repositories/workspaceRepository.ts`
- `scripts/test-hotfix-03-isolation.mjs`
- `scripts/test-hotfix-03-browser-smoke.mjs`
- `scripts/test-phase12-4-qa.mjs`
- `docs/clockit/PRODUCTION_HOTFIX_03.md`
- `docs/clockit/HOMEPAGE_REDESIGN.md`

Removed after verifying they belonged only to the retired landing implementation: `src/landing/initLanding.ts`, `src/landing/landing.html`, and `src/styles/landing.css`.

Final checks: `npm run typecheck`, `npm run build`, and `git diff --check` passed. `scripts/test-hotfix-03-isolation.mjs` passed its owner-scoped storage runtime and queue/IndexedDB/auth source guards. `scripts/test-phase12-4-qa.mjs` passed 8/8. The isolated Puppeteer smoke test was attempted with a fresh temporary profile, but Chrome failed to launch before navigation with a profile-already-running error and Windows credential error; therefore no actual mobile viewport, route, navigation, screenshot, or browser interaction assertions ran. No protected production data or Supabase configuration was modified.

## Deployment readiness

**NO-DEPLOY.** Owner boundaries are materially improved, but the account lifecycle, IndexedDB, and offline replay paths still require isolated-browser integration tests and review of quarantined legacy data before deployment approval.

## Follow-up stabilization pass (2026-11-13)

- Removed automatic notes fixture seeding for `local` and authenticated owners; only explicit Demo Mode seeds fixtures, and it seeds only when both owner-scoped stores are empty. Existing data is never replaced by a partial store.
- Removed the main Notes page's default demo folder selection and default sample-note preference. New notes can exist without a folder, and start with blank content and no generated tags.
- Routed main Notes page mutations through the shared note/folder repositories so Focus Notes and other subscribers receive change notifications.
- Main Notes page reloads its records when the repository owner changes and drops prior-owner content while the new owner's IndexedDB load is pending. An in-flight load also checks that the owner is unchanged before publishing results.
- Verified `npm.cmd run typecheck`, `npm.cmd run build`, and `node scripts/test-hotfix-03-isolation.mjs` pass after the follow-up changes.
- Retried the browser smoke test. It still fails before page navigation: Puppeteer reports `The browser is already running for <fresh temporary profile>` and Windows reports `ERROR: The user name or password is incorrect.` No existing Chrome profile was opened. As a result, live IndexedDB transactions/reload, real auth transitions, timer state switching, queue replay, and homepage browser checks remain unverified.
- Owner recovery remains explicit and non-destructive: the old shared IndexedDB and unscoped cache records contain no reliable owner ID. Export/archive and user-confirmed record mapping are required; ambiguous rows remain quarantined. No legacy data was deleted or assigned during this pass.

## Focus, homepage and security follow-up (2026-11-13)

### Implemented

- `FocusNotesPanel` uses the shared note/folder repositories for initialization, retrieval, creation and notification. Content writes keep explicit owner scoping. Per-owner/per-note save promises serialize autosaves so a slower earlier write cannot overwrite a later edit. While a write is pending, repository refreshes preserve the editor's latest draft.
- Focus clock and session controls now share one primary pane, with Notes as the second primary pane. Analog and numerical digital clock modes remain available. Browser Fullscreen API replaced the previous fixed-position imitation. Layout stacks on tablet/mobile widths.
- Actual route wiring in `src/App.tsx` maps `/` to `LandingPage`. It has the requested personal productivity message and Focus, Tasks, Habits, Notes, Workspace/personalization, FAQ, and final CTA content; source checks found no enterprise sprint-tracker claims/testimonials/statistics.
- Detailed workflow and browser limits are recorded in `FOCUS_REDESIGN.md` and `HOMEPAGE_REDESIGN.md`.

### Modified files in this follow-up

- `src/components/focus/FocusNotesPanel.tsx`
- `src/components/focus/FocusWorkspacePresentation.tsx`
- `src/components/focus/focus-workspace.css`
- `docs/clockit/FOCUS_REDESIGN.md`
- `docs/clockit/HOMEPAGE_REDESIGN.md`
- `docs/clockit/PRODUCTION_HOTFIX_03.md`

### Test results and screenshots

- `npm.cmd run typecheck` — passed.
- `npm.cmd run build` — passed.
- `node scripts/test-hotfix-03-isolation.mjs` — passed; it exercises LocalStorage owner scoping and uses source guards for IndexedDB, auth, Focus drafts and queue behavior. It does not drive a real browser/database/auth session.
- `git diff --check` — passed.
- Browser attempts: existing Puppeteer script failed before page load on a unique fresh temp profile with `The browser is already running` and Windows `ERROR: The user name or password is incorrect`. A separate direct Chrome headless invocation used another unique project-local profile; Chrome started but returned `Page load failed: net::ERR_NETWORK_ACCESS_DENIED` for `http://127.0.0.1:5174/`. The CUA surface could not safely identify the existing Brave tab URL and stopped before interaction. No user's existing browser profile was changed.
- No successful browser screenshot exists. Do not infer `/` rendering, responsive behavior, editor persistence, fullscreen behavior, auth switching or queue replay from the source checks/build.

### Remaining integration gate

**NO-DEPLOY.** Still required in an isolated browser environment: Focus Notes create/type/save/reload/retrieve/edit/save, navigation between Focus and Notes, two-account A → B → A and Demo ↔ real switching, IndexedDB owner-boundary checks, token refresh/session expiration, rapid switching during hydration, and actual offline queue replay/failure recovery. No production data or Supabase records were queried or changed in this follow-up.

Use the manual Focus flow in `FOCUS_REDESIGN.md` and homepage viewport checks in `HOMEPAGE_REDESIGN.md`. Capture screenshots and record actual results before changing this gate.
