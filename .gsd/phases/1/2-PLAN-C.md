---
phase: 1
plan: 2-C
wave: 2
---

# Plan 1.2 C – Case Studies Page

## Objective
Create a dedicated, responsive **`/case-studies` editorial page** describing genuine internal product-development stories based on existing ClockIt functionality, without fabricated customers, metrics, or testimonials. Route is registered in `src/App.tsx`; homepage link is provided by Plan B.

## Context
* New route `/case-studies` registered in `src/App.tsx`.
* Editorial stories reflect actual codebase features:
    1. Distraction-free Focus workspace.
    2. Unified productivity dashboard.
    3. Interconnected Notes experience.
    4. Personal habit tracking.
    5. Cross-device usability.
* Homepage-link implementation is managed exclusively in Plan B.
* Valid `package.json` scripts verified: `"dev"`, `"build"`, `"preview"`, `"typecheck"`.
* Stand-alone Puppeteer verification script: `scripts/verify-casestudies.cjs`.
* Temporary artifacts under `tmp/` (screenshots) are explicitly permitted for local verification and must never be committed.

## Permitted Files
### Source and plan files (only these may be modified or created):
```
src/pages/CaseStudiesPage.tsx
src/styles/casestudies.css
src/App.tsx
scripts/verify-casestudies.cjs
.gsd/phases/1/2-PLAN-C.md
```
### Allowed Temporary Artifacts (untracked, never committed):
```
tmp/screenshots/casestudies/*.png
```

## Tasks

### 0️⃣ Implement CaseStudiesPage Component
<task type="auto">
  <name>Create editorial CaseStudiesPage component</name>
  <files>src/pages/CaseStudiesPage.tsx, src/styles/casestudies.css</files>
  <action>
    • Build a clean editorial page with:
        – Header: “Case Studies” with subtitle focusing on product design and architectural journey.
        – 5 internal development story sections (Focus workspace, Unified dashboard, Notes experience, Habit tracking, Cross-device usability).
        – Each story structured as: The Problem, The Design Decision, The Implementation, The Result.
        – All narrative grounded strictly in existing ClockIt codebase functionality.
        – Footer navigation: `<Link to="/">Back to ClockIt</Link>` and a clear Get Started CTA linking to `/app` or `/signup`.
    • Style with ClockIt's established cream, forest-green, and muted-sage identity.
  </action>
  <verify>npm run typecheck && npm run build</verify>
  <done>Component compiles cleanly.</done>
</task>

### 1️⃣ Register Route in Application Router
<task type="auto">
  <name>Register /case-studies in App.tsx</name>
  <files>src/App.tsx</files>
  <action>
    • Add route `<Route path="/case-studies" element={<CaseStudiesPage />} />` within the public routing block.
    • Ensure lazy-loading or standard import is consistent with existing route definitions.
  </action>
  <verify>npm run typecheck && npm run build</verify>
  <done>Route registered; application compiles cleanly.</done>
</task>

### 2️⃣ Verification Script (Case Studies Browser Test)
<task type="auto">
  <name>Create and run case studies verification script</name>
  <files>scripts/verify-casestudies.cjs</files>
  <action>
    • Write a Puppeteer script that:
        1. Checks browser availability explicitly.
        2. Navigates directly to `/case-studies`.
        3. Tests viewports: 320px, 375px, 768px, 1024px, 1440px.
        4. Saves screenshots to `tmp/screenshots/casestudies/casestudies-<width>.png`.
        5. Asserts `document.body.scrollWidth === window.innerWidth`.
        6. Verifies all 5 story headings and the back link exist in the DOM.
  </action>
  <verify>node scripts/verify-casestudies.cjs</verify>
  <done>
    • Script exits with code 0.
    • Screenshots saved for all viewports; all 5 story headings verified.
  </done>
</task>

### 3️⃣ Rollback & Working-Tree Safety
<task type="auto">
  <name>Verify working tree and document rollback</name>
  <files>.gsd/phases/1/2-PLAN-C.md</files>
  <action>
    • Check working-tree status with `git status --short` and `git diff --check`.
    • Rollback commands if needed:
        – For modified router file:
          `git restore src/App.tsx`
        – For created source/style files and script:
          `Remove-Item -Path src/pages/CaseStudiesPage.tsx, src/styles/casestudies.css, scripts/verify-casestudies.cjs -ErrorAction SilentlyContinue`
        – For temporary artifacts:
          `Remove-Item -Path tmp/screenshots/casestudies -Recurse -Force -ErrorAction SilentlyContinue`
  </action>
  <verify>git diff --check</verify>
  <done>Working tree verified; rollback commands documented.</done>
</task>

## Acceptance Criteria
1. Dedicated `/case-studies` route loads cleanly.
2. Contains all 5 product-development story sections describing actual ClockIt architecture.
3. No fabricated customers, enterprise partnerships, or unsupported metrics.
4. Back navigation to ClockIt and Get Started CTA present.
5. Zero horizontal overflow across all five viewports.
6. TypeScript check and production build pass.
7. Hotfix 03 owner isolation preserved.

## Test Commands (Only Verified Scripts)
```powershell
node scripts/verify-casestudies.cjs
npm run typecheck
npm run build
git status --short
git diff --check
```
