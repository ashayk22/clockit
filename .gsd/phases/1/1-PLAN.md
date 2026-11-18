---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1 – Focus → Notes Responsive Refactor

## Objective
Make the **Notes panel inside the Focus workspace** fully responsive on mobile, tablet, and desktop while leaving **all repository, storage, authentication, Supabase, and Hotfix 03 owner-isolation code untouched**.

## Context
* Component to edit: `src/components/focus/FocusWorkspacePresentation.tsx`
* Layout CSS to edit: `src/styles/focus.css` and `src/styles/notes.css`
* Valid `package.json` scripts verified: `"dev"`, `"build"`, `"preview"`, `"typecheck"`. No `test`, `lint`, or `lint:css` script exists.
* Verification will be performed with a stand-alone Puppeteer script (`scripts/verify-focus-layout.cjs`) invoked directly via `node`.
* Temporary artifacts under `tmp/` (inspection notes, screenshots) are explicitly permitted for local verification and must never be committed.

## Permitted Files
### Source and plan files (only these may be modified or created):
```
src/components/focus/FocusWorkspacePresentation.tsx
src/components/focus/focus-workspace.css
src/styles/clockit-theme.css
scripts/verify-focus-layout.cjs
.gsd/phases/1/1-PLAN.md
```
### Allowed Temporary Artifacts (untracked, never committed):
```
tmp/inspect-focus.md
tmp/screenshots/focus/*.png
```

## Tasks

### 0️⃣ Inspect Current Component & CSS (no code modifications)
<task type="auto">
  <name>Inspect current UI structure</name>
  <files>src/components/focus/FocusWorkspacePresentation.tsx, src/styles/focus.css, src/styles/notes.css</files>
  <action>
    • Open the three files, inspect the existing Flex container, toolbar markup, and any hard-coded dimensions.
    • Record observations in `tmp/inspect-focus.md`.
  </action>
  <verify>git status --short</verify>
  <done>Inspection completed; no source files modified.</done>
</task>

### 1️⃣ Responsive Flex-Column Layout (lg breakpoint)
<task type="auto">
  <name>Responsive Flex-Column with lg breakpoint</name>
  <files>src/components/focus/FocusWorkspacePresentation.tsx</files>
  <action>
    • Configure the container with `flex flex-col lg:flex-row` so the side-by-side layout begins at 1024px.
    • Inside the notes panel, structure the toolbar and editor in a flex-column (`flex flex-col h-full min-h-0`):
        – Toolbar receives `flex-none` (shrink-0) so it remains pinned and visible.
        – Editor container receives `flex-1 min-h-0` so it expands to fill available space without arbitrary height calculations.
  </action>
  <verify>node scripts/verify-focus-layout.cjs</verify>
  <done>
    • No horizontal overflow at any required viewport (320px, 375px, 768px, 1024px, 1440px).
    • Toolbar remains visible; editor fills remaining height.
    • Screenshots confirm clock-above-notes on mobile/tablet, side-by-side on desktop.
  </done>
</task>

### 2️⃣ Mobile-First CSS Adjustments
<task type="auto">
  <name>Mobile-First CSS adjustments</name>
  <files>src/styles/focus.css, src/styles/notes.css</files>
  <action>
    • Ensure notes container allows smooth scrolling with `overflow-y: auto`.
    • Ensure editor container respects `min-height: 0` and flex expansion.
    • Guard transitions with `@media (prefers-reduced-motion: reduce) { transition: none; }`.
    • Do not use `overflow-x: hidden` to mask layout defects.
  </action>
  <verify>npm run typecheck && npm run build</verify>
  <done>
    • TypeScript check and Vite build pass without errors.
    • Layout remains free of horizontal overflow.
  </done>
</task>

### 3️⃣ Verification Script (Browser Viewport Test)
<task type="auto">
  <name>Create and run layout verification script</name>
  <files>scripts/verify-focus-layout.cjs</files>
  <action>
    • Write a Puppeteer script that:
        1. Explicitly checks Puppeteer browser availability. If browser fails to launch, exits with non-zero code immediately.
        2. Starts or connects to the local Vite dev server.
        3. Navigates to the Focus route (`/app/focus`).
        4. Evaluates viewports: 320px, 375px, 768px, 1024px, 1440px.
        5. Saves screenshots to `tmp/screenshots/focus/focus-<width>.png`.
        6. Asserts `document.body.scrollWidth === window.innerWidth` at each viewport.
        7. Exits with code 0 only when all assertions succeed and screenshots are captured.
  </action>
  <verify>node scripts/verify-focus-layout.cjs</verify>
  <done>
    • Script executes with exit code 0.
    • All five screenshots exist under `tmp/screenshots/focus/` and show correct layout.
  </done>
</task>

### 4️⃣ Rollback & Working-Tree Safety
<task type="auto">
  <name>Verify working tree and document rollback</name>
  <files>.gsd/phases/1/1-PLAN.md</files>
  <action>
    • Verify working-tree status with `git status --short` and `git diff --check`.
    • Ensure no files outside the permitted list were touched.
    • Rollback commands if needed:
        – For modified source files:
          `git restore src/components/focus/FocusWorkspacePresentation.tsx src/components/focus/focus-workspace.css src/styles/clockit-theme.css`
        – For created script:
          `Remove-Item -Path scripts/verify-focus-layout.cjs -ErrorAction SilentlyContinue`
        – For temporary artifacts:
          `Remove-Item -Path tmp/inspect-focus.md, tmp/screenshots/focus -Recurse -Force -ErrorAction SilentlyContinue`
  </action>
  <verify>git diff --check</verify>
  <done>Working tree verified; rollback commands documented.</done>
</task>

## Acceptance Criteria
1. Desktop (≥1024px): Clock and notes remain side-by-side with unaltered visual appearance.
2. Tablet (768px) and mobile (320px, 375px): Stack vertically; toolbar is fully visible; editor fills available space via flex.
3. Zero horizontal overflow across 320px, 375px, 768px, 1024px, 1440px.
4. Five visual inspection screenshots captured under `tmp/screenshots/focus/`.
5. TypeScript check (`npm run typecheck`) and build (`npm run build`) pass.
6. Verification script exits with code 0; browser launch failure produces a test failure, never a pass.
7. Hotfix 03 owner-isolation and repository code remain untouched.

## Test Commands (Only Verified Scripts)
```powershell
node scripts/verify-focus-layout.cjs
npm run typecheck
npm run build
git status --short
git diff --check
```
