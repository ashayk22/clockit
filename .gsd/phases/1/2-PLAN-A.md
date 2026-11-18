---
phase: 1
plan: 2-A
wave: 2
---

# Plan 1.2 A – Shared Layout & Global Responsiveness

## Objective
Audit and fix **only the shared layout components** (Header, Sidebar, MobileNavBar) and shared CSS causing real overflow or touch-target issues, preserving existing desktop dimensions and Hotfix 03 owner isolation.

## Context
* Shared components: `src/components/layout/Header.tsx`, `Sidebar.tsx`, `MobileNavBar.tsx`.
* Layout CSS: `src/styles/layout.css` (or relevant layout styles).
* Valid `package.json` scripts verified: `"dev"`, `"build"`, `"preview"`, `"typecheck"`.
* Stand-alone Puppeteer verification script: `scripts/verify-global.cjs`.
* Authenticated routes are checked using a valid test/demo session; login redirects are never counted as successful page tests.
* Temporary artifacts under `tmp/` (audit notes, screenshots) are explicitly permitted for local verification and must never be committed.

## Permitted Files
### Source and plan files (only these may be modified or created):
```
src/components/layout/Header.tsx
src/components/layout/Sidebar.tsx
src/components/layout/MobileNavBar.tsx
src/styles/clockit-theme.css
scripts/verify-global.cjs
.gsd/phases/1/2-PLAN-A.md
```
### Allowed Temporary Artifacts (untracked, never committed):
```
tmp/layout-audit.md
tmp/screenshots/global/*.png
```

## Tasks

### 0️⃣ Layout Style Audit (identify real issues)
<task type="auto">
  <name>Generate layout style audit</name>
  <files>src/styles/layout.css, src/components/layout/*.tsx</files>
  <action>
    • Audit Header, Sidebar, and MobileNavBar for fixed widths or rigid constraints that force overflow on viewports < 1024px.
    • Record real issues in `tmp/layout-audit.md`.
    • Do not arbitrarily alter desktop sidebar dimensions if no defect exists.
  </action>
  <verify>git status --short</verify>
  <done>Audit complete; only confirmed problematic constraints marked for modification.</done>
</task>

### 1️⃣ Header & MobileNavBar Responsiveness
<task type="auto">
  <name>Responsive Header & MobileNavBar adjustments</name>
  <files>src/components/layout/Header.tsx, src/components/layout/MobileNavBar.tsx, src/styles/layout.css</files>
  <action>
    • Header: Use responsive flex utilities without fixed pixel widths.
    • MobileNavBar: Display on screens ≤ 1024px (`lg:hidden`). Ensure touch targets meet ≥ 44px.
    • Ensure navigation bars do not obscure or overlap application content.
    • Do not mask layout bugs with `overflow-x: hidden`.
  </action>
  <verify>npm run typecheck && npm run build</verify>
  <done>Header and MobileNavBar compile cleanly and provide accessible touch targets.</done>
</task>

### 2️⃣ Sidebar Responsive Behavior
<task type="auto">
  <name>Responsive Sidebar scaling</name>
  <files>src/components/layout/Sidebar.tsx, src/styles/layout.css</files>
  <action>
    • Preserve desktop sidebar dimensions for desktop viewports (≥ 1024px).
    • On mobile/tablet screens (≤ 1024px), ensure the sidebar collapses cleanly into mobile navigation without creating horizontal page overflow.
    • Ensure interactive nav links provide comfortable hit areas (≥ 44px).
  </action>
  <verify>npm run typecheck && npm run build</verify>
  <done>Sidebar behaves responsively across desktop, tablet, and mobile.</done>
</task>

### 3️⃣ Verification Script (Global Browser Viewport Test)
<task type="auto">
  <name>Create and run global verification script</name>
  <files>scripts/verify-global.cjs</files>
  <action>
    • Write a Puppeteer script that:
        1. Checks browser availability explicitly (fails immediately on launch errors).
        2. Establishes a valid session (e.g., Demo Mode) to test application routes (`/app/focus`, `/app/tasks`, `/app/notes`, `/app/habits`, `/app/calendar`, `/app/analytics`, `/app/settings`).
        3. Never counts a redirect to `/login` as a successful route test.
        4. Tests viewports: 320px, 375px, 768px, 1024px, 1440px.
        5. Saves screenshots to `tmp/screenshots/global/<route>-<width>.png`.
        6. Asserts `document.body.scrollWidth === window.innerWidth`.
        7. Verifies navigation bars do not overlap application content.
  </action>
  <verify>node scripts/verify-global.cjs</verify>
  <done>
    • Script exits with code 0.
    • Screenshots saved for all routes and viewports; zero overflow detected.
  </done>
</task>

### 4️⃣ Rollback & Working-Tree Safety
<task type="auto">
  <name>Verify working tree and document rollback</name>
  <files>.gsd/phases/1/2-PLAN-A.md</files>
  <action>
    • Check working-tree status with `git status --short` and `git diff --check`.
    • Rollback commands if needed:
        – For modified source files:
          `git restore src/components/layout/Header.tsx src/components/layout/Sidebar.tsx src/components/layout/MobileNavBar.tsx src/styles/clockit-theme.css`
        – For created script:
          `Remove-Item -Path scripts/verify-global.cjs -ErrorAction SilentlyContinue`
        – For temporary artifacts:
          `Remove-Item -Path tmp/layout-audit.md, tmp/screenshots/global -Recurse -Force -ErrorAction SilentlyContinue`
  </action>
  <verify>git diff --check</verify>
  <done>Working tree verified; rollback commands documented.</done>
</task>

## Acceptance Criteria
1. Zero horizontal overflow across all tested routes at 320px, 375px, 768px, 1024px, 1440px.
2. Desktop sidebar width preserved; collapses cleanly on viewports ≤ 1024px.
3. Mobile navigation does not overlap page content; touch targets are ≥ 44px.
4. Authenticated routes tested under valid session; login redirects are not counted as passes.
5. All screenshots captured under `tmp/screenshots/global/`.
6. TypeScript check and production build pass.
7. Hotfix 03 owner isolation preserved.

## Test Commands (Only Verified Scripts)
```powershell
node scripts/verify-global.cjs
npm run typecheck
npm run build
git status --short
git diff --check
```
