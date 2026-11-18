# ClockIt Focus Workspace

## Current implementation

The authenticated `/app/focus` route renders the existing `FocusPage`, which supplies the timer/session state to `FocusWorkspacePresentation`. The workspace now has two primary panes: the clock/session controls and the Focus Notes editor.

- Analog clock shows the local time with smoothly updated hands.
- Digital clock shows conventional 24-hour `HH:MM` with an optional seconds display.
- Focus, short-break and long-break countdown modes use the existing timer settings and persistence.
- Start/pause, reset, next session, task selection and timer settings remain connected to the existing FocusPage handlers.
- The Notes panel uses the shared `noteRepository`, `noteFolderRepository`, owner context and IndexedDB notes storage. It uses the same `NotesEditor` as the main Notes page.
- Notes content autosaves after editor debounce. Saves are serialized per owner and note to prevent older asynchronous writes from overtaking newer edits. Failed writes keep an owner-scoped recovery draft with a retry action.
- Account changes clear the panel during hydration. Owner-explicit IndexedDB writes remain in the original owner's database if a save finishes after a switch.
- Fullscreen uses the browser Fullscreen API (`requestFullscreen`/`exitFullscreen`) and tracks `fullscreenchange`. If the browser context refuses fullscreen, the interface reports that status.
- Responsive layout stacks the clock/session pane and notes pane on narrow screens; no image assets or generated background are used.

## Files

- `src/components/focus/FocusNotesPanel.tsx`
- `src/components/focus/FocusWorkspacePresentation.tsx`
- `src/components/focus/FocusClockDisplay.tsx`
- `src/components/focus/focus-workspace.css`
- `src/components/notes/NotesEditor.tsx`
- `src/components/pages/FocusPage.tsx`
- `src/services/notesStorage.ts`
- `src/services/repositories/notesRepository.ts`

## Verification

- TypeScript check and production build passed on 2026-11-13 after the Focus changes.
- Existing owner-scope regression script passes, but its IndexedDB/auth/queue assertions are source guards and are not a live integration test.
- The requested create, type, save, refresh, retrieve, edit, navigate, and account-switch workflow was **not** completed in a live browser. Puppeteer fails on a fresh profile before navigation (`The browser is already running` and Windows credential error). Direct isolated headless Chrome reports `net::ERR_NETWORK_ACCESS_DENIED` when loading the local Vite URL. Do not treat Focus Notes as integration-verified.
- No screenshot was captured because no browser surface could render the project route in this environment.

## Manual verification instructions

Use a disposable local test account or Demo Mode and never use production records for destructive testing.

1. Start the development server with `npm.cmd run dev -- --host 127.0.0.1 --port 5174`, then open `http://127.0.0.1:5174/` in a browser profile created solely for this test.
2. Enter Demo Mode (or sign into a disposable test account), open `/app/focus`, and wait for the Focus Notes panel to finish loading.
3. Select **Notes**, click **Create note**, type a unique title and several lines in the editor, then wait for the save indicator to return to saved.
4. Reload `/app/focus`, select the note and confirm the exact content and title persisted. Edit the content, wait for save, reload, and confirm the second edit.
5. Navigate to `/app/notes`; confirm the same title/content appears. Edit and save in Notes, navigate back to Focus, and confirm Focus shows the latest Notes edit.
6. With two disposable test accounts, create distinct uniquely named notes under each. Switch A → B → A, verifying each owner only sees their own records. Repeat with Demo → test account and test account → Demo. Do not infer recovery ownership from the current account.
7. Check browser DevTools Application → IndexedDB for separate databases named `clockit-notes-db:user%3A<UUID>` (URL encoding may differ by DevTools display) and `clockit-notes-db:demo`; verify that note records carry the matching `userId`.
8. On `/app/focus`, switch Analog/Digital, toggle seconds, test countdown start/pause/reset/next, and use **Enter fullscreen**. Confirm the browser enters true fullscreen and Escape exits it. Repeat at mobile width and confirm the notes editor remains usable.

Capture screenshots at desktop Focus, mobile Focus, and the redesigned `/` route when these checks are run in the isolated browser. Record browser/version, test account labels (never credentials), and pass/fail for each step in the hotfix report.
