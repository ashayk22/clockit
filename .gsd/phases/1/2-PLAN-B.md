---
phase: 1
plan: 2-B
wave: 2
---

# Plan 1.2 B – Homepage Redesign

## Objective
Update the **public homepage copy** with the new brand messaging, reorder sections per specification, remove legacy enterprise claims, and add the Case Studies preview link, preserving ClockIt's cream, forest-green, and muted-sage visual identity without modifying application functionality.

## Context
* Identify exact homepage component rendering `/` (e.g., `src/landing/LandingPage.tsx`).
* Maintain established visual identity: warm cream, forest-green, muted-sage. Avoid generic SaaS redesigns, excessive gradients, or unnecessary glassmorphism.
* Homepage owns the Case Studies preview section and the `<Link to="/case-studies">` navigation link.
* Valid `package.json` scripts verified: `"dev"`, `"build"`, `"preview"`, `"typecheck"`.
* Stand-alone Puppeteer verification script: `scripts/verify-homepage.cjs`.
* Temporary artifacts under `tmp/` (identification notes, screenshots) are explicitly permitted for local verification and must never be committed.

## Permitted Files
### Source and plan files (only these may be modified or created):
```
src/landing/LandingPage.tsx  (or exact homepage component confirmed in Task 0)
scripts/verify-homepage.cjs
.gsd/phases/1/2-PLAN-B.md
```
### Allowed Temporary Artifacts (untracked, never committed):
```
tmp/homepage-identify.md
tmp/screenshots/homepage/*.png
```

## Tasks

### 0️⃣ Confirm Homepage Route Component (no code modifications)
<task type="auto">
  <name>Confirm root route component</name>
  <files>src/App.tsx</files>
  <action>
    • Check `src/App.tsx` router configuration for `path="/"`.
    • Record verified file path in `tmp/homepage-identify.md`.
  </action>
  <verify>git status --short</verify>
  <done>Root route component confirmed.</done>
</task>

### 1️⃣ Update Hero Copy & Brand Messaging
<task type="auto">
  <name>Update hero copy</name>
  <files>src/landing/LandingPage.tsx</files>
  <action>
    • Update headline to: **“Make room for what matters.”**
    • Update supporting copy to: **“Your day, your ideas, your routines — all in one place. ClockIt brings focus, planning and personal organization into a workspace that moves at your pace.”**
    • Keep existing styling and palette intact. Do not add generic SaaS gradients or animations.
  </action>
  <verify>npm run typecheck && npm run build</verify>
  <done>Hero copy updated; build passes.</done>
</task>

### 2️⃣ Reorder Sections & Add Case Studies Preview
<task type="auto">
  <name>Reorder sections and add Case Studies link</name>
  <files>src/landing/LandingPage.tsx</files>
  <action>
    • Arrange sections according to hierarchy:
        1. Hero
        2. What you can do with ClockIt
        3. Focus showcase
        4. Tasks and planning
        5. Habit tracking
        6. Notes and knowledge organization
        7. Your personal workspace
        8. Case studies preview (with `<Link to="/case-studies">`)
        9. FAQ
        10. Final CTA
    • Remove enterprise sprint-tracker language, fabricated testimonials, and unsupported metrics.
    • Preserve all existing interactive components and logic.
  </action>
  <verify>npm run typecheck && npm run build</verify>
  <done>Sections reordered; Case Studies preview link present; build passes.</done>
</task>

### 3️⃣ Verification Script (Homepage Browser Test)
<task type="auto">
  <name>Create and run homepage verification script</name>
  <files>scripts/verify-homepage.cjs</files>
  <action>
    • Write a Puppeteer script that:
        1. Checks browser availability explicitly.
        2. Navigates to `/`.
        3. Tests viewports: 320px, 375px, 768px, 1024px, 1440px.
        4. Saves screenshots to `tmp/screenshots/homepage/home-<width>.png`.
        5. Asserts `document.body.scrollWidth === window.innerWidth`.
        6. Verifies headline and `/case-studies` link exist in the DOM.
  </action>
  <verify>node scripts/verify-homepage.cjs</verify>
  <done>
    • Script exits with code 0.
    • Screenshots saved for all viewports; headline and link confirmed.
  </done>
</task>

### 4️⃣ Rollback & Working-Tree Safety
<task type="auto">
  <name>Verify working tree and document rollback</name>
  <files>.gsd/phases/1/2-PLAN-B.md</files>
  <action>
    • Check working-tree status with `git status --short` and `git diff --check`.
    • Rollback commands if needed:
        – For modified homepage file:
          `git restore src/landing/LandingPage.tsx`
        – For created script:
          `Remove-Item -Path scripts/verify-homepage.cjs -ErrorAction SilentlyContinue`
        – For temporary artifacts:
          `Remove-Item -Path tmp/homepage-identify.md, tmp/screenshots/homepage -Recurse -Force -ErrorAction SilentlyContinue`
  </action>
  <verify>git diff --check</verify>
  <done>Working tree verified; rollback commands documented.</done>
</task>

## Acceptance Criteria
1. Exact headline and supporting paragraph rendered.
2. Sections follow specified 10-part hierarchy.
3. Outdated enterprise language and fabricated testimonials removed.
4. Case Studies preview link points to `/case-studies`.
5. Warm cream, forest-green, and muted-sage visual identity preserved.
6. Zero horizontal overflow across all five viewports.
7. TypeScript check and production build pass.

## Test Commands (Only Verified Scripts)
```powershell
node scripts/verify-homepage.cjs
npm run typecheck
npm run build
git status --short
git diff --check
```
