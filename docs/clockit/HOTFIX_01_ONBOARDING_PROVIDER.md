# ClockIt — Production Hotfix 01: OnboardingProvider Context Hierarchy

**Issue Reference:** Production Runtime Error on `/onboarding`\
**Error Message:** `useOnboarding must be used within an OnboardingProvider`\
**Date:** 2026-11-12\
**Status:** RESOLVED & VERIFIED

---

## 1. Problem Diagnosis & Root Cause

### Symptoms
When navigating directly to `https://clockitt.vercel.app/onboarding` (or visiting `/onboarding` as a freshly registered user completing account personalization), the page crashed with:
```
Error: useOnboarding must be used within an OnboardingProvider
    at useOnboarding (OnboardingContext.tsx:240)
    at OnboardingWizard (OnboardingWizard.tsx:55)
```

### Root Cause
1. `OnboardingWizard` imports and calls `useOnboarding()`:
   ```typescript
   // src/components/onboarding/OnboardingWizard.tsx line 55:
   const { openTutorialDirectory } = useOnboarding();
   ```
2. In `src/App.tsx`, the route structure was:
   ```tsx
   {/* 2b. Personalized Onboarding (Guarded) */}
   <Route
     path="/onboarding"
     element={
       <ProtectedRoute>
         <OnboardingWizard />
       </ProtectedRoute>
     }
   />

   {/* 3. Authenticated dashboard */}
   <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
   ...
   ```
3. `OnboardingProvider` was previously rendered **only inside `DashboardLayout.tsx`** (line 197).
4. Because `/onboarding` is a dedicated standalone full-page view mounted outside `DashboardLayout`, it was rendered without an enclosing `OnboardingProvider` in its React tree.
5. Consequently, any render of `OnboardingWizard` invoked `useOnboarding()`, which threw the unhandled exception.

---

## 2. Solution & Architectural Fix

### App.tsx Hierarchy Adjustment
Wrapped `<OnboardingWizard />` inside `<OnboardingProvider>` in `src/App.tsx`:

```tsx
// src/App.tsx
import { OnboardingProvider } from './components/onboarding/OnboardingContext';

...

{/* 2b. Personalized Onboarding (Guarded) */}
<Route
  path="/onboarding"
  element={
    <ProtectedRoute>
      <OnboardingProvider>
        <OnboardingWizard />
      </OnboardingProvider>
    </ProtectedRoute>
  }
/>
```

### Guarantees Preserved
1. **Authentication Enforcement:** `<ProtectedRoute>` remains the outermost guard. Unauthenticated visitors are immediately bounced to `/login` with return destination saved in router state.
2. **Onboarding Flow & Personalization:** Completion flags (`onboardingCompleted`), challenge preferences, planning style, focus durations, and appearance settings continue saving directly to `preferencesRepository` and Supabase cloud.
3. **No Duplicate Mounting:** `/onboarding` and `/app` are distinct sibling routes. Only one `OnboardingProvider` is ever mounted at any point in the application lifecycle.
4. **Lazy Loading:** `OnboardingWizard` continues loading via `lazyWithRetry` without blocking the initial bundle.

---

## 3. Verification & Regression Testing

### Test Suite Execution Summary

| Test Suite | Result | Details |
|---|---|---|
| **Hotfix 01 Regression Test** (`scripts/test-hotfix-01-onboarding.mjs`) | ✅ **PASS** | Direct `/onboarding?edit=true` navigation, card mount, context check, unauthenticated `/login` redirect |
| **Phase 13.2 Reliability Suite** (`scripts/test-phase13-2-reliability.mjs`) | ✅ **PASS (10/10)** | SPA fallback, legacy cleanup, 0003 atomic SQL, Demo mode, nested route refresh, error boundaries |
| **Phase 13.3 Auth & Privacy Suite** (`scripts/test-phase13-3-auth-privacy.mjs`) | ✅ **PASS (7/7)** | Password meter, reset password route, settings controls, data export wiring |
| **Phase 13.4 Performance & A11y Suite** (`scripts/test-phase13-4-perf-a11y.mjs`) | ✅ **PASS (7/7)** | Route-level code splitting, bundle sizes (<500 kB), keyboard trap, reduced motion |
| **Phase 12.4 Onboarding Logic** (`scripts/test-phase12-4-onboarding.mjs`) | ✅ **PASS (5/5)** | Name sanitation, duration limits, returning user preservation, timer presets |
| **TypeScript Typecheck** (`npm run typecheck`) | ✅ **PASS** | 0 errors |
| **Production Build** (`npm run build`) | ✅ **PASS** | Built in ~3.9s, 0 warnings |
| **Git Diff Whitespace Check** (`git diff --check`) | ✅ **PASS** | 0 whitespace or formatting errors |

---

## 4. Modified Files

1. `src/App.tsx` — Added `OnboardingProvider` import and wrapped `<OnboardingWizard />` under route `/onboarding`.
2. `scripts/test-hotfix-01-onboarding.mjs` — Added dedicated automated regression test for direct `/onboarding` navigation.
3. `docs/clockit/HOTFIX_01_ONBOARDING_PROVIDER.md` — This technical documentation.
