# ClockIt — Environment Configuration Audit

**Phase:** 13.5 — Production Infrastructure\
**Audit type:** Read-only\
**Date:** 2026-11-12\
**Status:** COMPLETE

---

## 1. Files Inspected

| File | Present | Notes |
|---|---|---|
| `.env` | ✅ | Development credentials — git-ignored |
| `.env.example` | ✅ | Placeholder template committed to repo |
| `.gitignore` | ✅ | Vite default + env exclusions |
| `vite.config.js` | ✅ | No hardcoded env vars |
| `package.json` | ✅ | No env vars referenced |
| `src/lib/supabaseClient.ts` | ✅ | Only consumer of VITE_ vars |
| `src/components/common/ErrorBoundary.tsx` | ✅ | Uses built-in `import.meta.env.DEV` |
| `src/auth/authStore.ts` | ✅ | References vars in comment only — not consumed |

---

## 2. Environment Variables Used by the Application

### 2.1 Custom VITE_ Variables

| Variable | File | Line | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `src/lib/supabaseClient.ts` | 12 | Supabase project REST/Auth endpoint |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabaseClient.ts` | 13 | Supabase publishable anon JWT |

**These are the only two custom environment variables consumed by the application.**

### 2.2 Built-in Vite Flags (not custom variables)

| Variable | File | Purpose |
|---|---|---|
| `import.meta.env.DEV` | `src/components/common/ErrorBoundary.tsx:84` | Development-only detailed error output |
| `import.meta.env.MODE` | Implicit (Vite) | Set to `'development'` or `'production'` by Vite |
| `import.meta.env.PROD` | Implicit (Vite) | Boolean — true in production builds |

> [!NOTE]
> `import.meta.env.DEV` is a Vite built-in and is **never** `true` in a production build. No configuration needed; Vite injects it automatically.

### 2.3 Non-VITE_ Keys in `.env` (Server-Side / Test Only)

The `.env` file also contains five keys used exclusively by the Phase 13.4 Puppeteer test suite (`scripts/test-phase13-4-perf-a11y.mjs`). **None of these are exposed to the browser bundle.**

| Key | Purpose |
|---|---|
| `CLOCKIT_TEST_EMAIL_BASE` | Base address for test account generation |
| `CLOCKIT_TEST_USER_A_EMAIL` | QA User A email |
| `CLOCKIT_TEST_USER_A_PASSWORD` | QA User A password |
| `CLOCKIT_TEST_USER_B_EMAIL` | QA User B email |
| `CLOCKIT_TEST_USER_B_PASSWORD` | QA User B password |

> [!IMPORTANT]
> Because these keys do **not** use the `VITE_` prefix, Vite **never** embeds them into the client bundle. They are safe to include in `.env` for local test runner use, but must never be prefixed with `VITE_`.

---

## 3. `import.meta.env` Usage

**Answer: YES** — the application uses `import.meta.env` exclusively. There are no `process.env` references anywhere in `src/`.

| Usage | File | Type |
|---|---|---|
| `import.meta.env.VITE_SUPABASE_URL` | `supabaseClient.ts` | Custom |
| `import.meta.env.VITE_SUPABASE_ANON_KEY` | `supabaseClient.ts` | Custom |
| `import.meta.env.DEV` | `ErrorBoundary.tsx` | Vite built-in |

---

## 4. Separate Production Environment Files

**Answer: YES — Vite natively supports this.**

Vite loads `.env` files in the following priority order (highest wins):

```
.env.production.local    ← highest priority (git-ignored, production secrets)
.env.local               ← git-ignored, local overrides for all modes
.env.production          ← committed, production defaults (no secrets)
.env                     ← committed, shared defaults
```

### Current State

| File | Exists | Committed | Purpose |
|---|---|---|---|
| `.env` | ✅ | ❌ (git-ignored) | Development — points to `nook` |
| `.env.example` | ✅ | ✅ | Placeholder template for onboarding |
| `.env.local` | ❌ | ❌ | Not in use |
| `.env.production` | ❌ | ❌ | Not yet created |
| `.env.production.local` | ❌ | ❌ | Not yet created |

### Recommended Setup for Phase 13.6

For CI/CD deployment (Vercel):
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` directly in **Vercel Project Settings → Environment Variables**, scoped to `Production`.
- Do not commit `.env.production` or `.env.production.local` with real credentials.
- Use `.env.production` only for non-secret production defaults (e.g., feature flags with no security impact).

---

## 5. `.env.production.local` — Git-Ignored Status

**Answer: YES — it is covered by an existing `.gitignore` rule.**

The `.gitignore` contains these env-related rules:

```gitignore
.env
.env.local
.env.*.local
```

The glob `.env.*.local` matches:
- `.env.development.local` ✅
- `.env.production.local` ✅
- `.env.staging.local` ✅
- Any other mode-specific local override ✅

> [!IMPORTANT]
> `.env.production.local` is properly git-ignored. No additional `.gitignore` changes are needed before Phase 13.6.

---

## 6. Current `.env` — Development Target

**Answer: Confirmed — `.env` currently points to the `nook` development project.**

The URL in `.env` references project ref `gynycspbhfoyisgcuiik` (the shared `nook` Supabase project).

This is correct for the current development phase. The file must be replaced or supplemented (via Vercel environment variables) before the production deployment in Phase 13.6.

> [!WARNING]
> The `.env` file must **never** be committed to version control. It is git-ignored. Confirm this remains true before every push: `git status --short | grep '\.env'` should return nothing.

---

## 7. Supabase Client Security Analysis

**File:** `src/lib/supabaseClient.ts`

```typescript
const url   = (import.meta.env.VITE_SUPABASE_URL   as string | undefined)?.trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'clockit-supabase-auth',
      },
    })
  : null;
```

| Check | Result |
|---|---|
| Uses anon key only (not service_role) | ✅ PASS |
| Gracefully handles missing config (`null` client) | ✅ PASS |
| No hard crash on missing env vars | ✅ PASS |
| `storageKey` isolated from café app session | ✅ PASS |
| `autoRefreshToken: true` | ✅ PASS |
| `detectSessionInUrl: true` (required for OAuth/magic links) | ✅ PASS |
| No hardcoded credentials | ✅ PASS |
| No `service_role` key anywhere in `src/` | ✅ PASS |

---

## 8. `vite.config.js` Analysis

No environment variables are hardcoded in `vite.config.js`. The file only defines:

- `@vitejs/plugin-react` plugin
- `manualChunks` vendor splitting (5 vendor groups)
- `chunkSizeWarningLimit: 600` kB

| Check | Result |
|---|---|
| No hardcoded API URLs or keys | ✅ PASS |
| No `define` block injecting secrets | ✅ PASS |
| No `envPrefix` override (Vite default `VITE_` prefix applies) | ✅ PASS |

---

## 9. `package.json` Analysis

| Field | Value |
|---|---|
| Package name | `steep-tracker` |
| Version | `1.0.0` |
| Module type | `"type": "module"` (ES modules) |
| Vite version | `^6.2.0` |
| TypeScript version | `^7.0.2` |
| React version | `^19.3.1` |
| Supabase JS version | `^2.119.0` |

**Available scripts:**

| Script | Command |
|---|---|
| `dev` | `vite` |
| `build` | `vite build` |
| `preview` | `vite preview` |
| `typecheck` | `tsc --noEmit` |

> [!NOTE]
> The package name `steep-tracker` is an internal name from the project's origin. This has no effect on the application or deployment. It may be updated to `clockit` in Phase 13.6 if desired, but it is not required.

No environment variables are referenced in `package.json`.

---

## 10. Recommended Configuration — Development vs. Production

### Development (`.env` — git-ignored)

```bash
# Points to nook shared development project
VITE_SUPABASE_URL=https://gynycspbhfoyisgcuiik.supabase.co
VITE_SUPABASE_ANON_KEY=<nook-anon-key>

# Test-only (never VITE_ prefixed — never exposed to browser)
CLOCKIT_TEST_EMAIL_BASE=...
CLOCKIT_TEST_USER_A_EMAIL=...
CLOCKIT_TEST_USER_A_PASSWORD=...
CLOCKIT_TEST_USER_B_EMAIL=...
CLOCKIT_TEST_USER_B_PASSWORD=...
```

### Production (Vercel Project Settings — not committed)

```bash
# Points to clockit-production Supabase project (Phase 13.5)
VITE_SUPABASE_URL=https://<clockit-production-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<clockit-production-anon-key>
```

> [!CAUTION]
> Never set test account credentials (`CLOCKIT_TEST_*`) in Vercel production environment variables. These are for local test runner use only.

### Production Preview / Staging (Vercel — optional)

If Vercel preview deployments should use a staging Supabase project:

```bash
VITE_SUPABASE_URL=https://<clockit-staging-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<clockit-staging-anon-key>
```

Scope these to **Preview** in Vercel's environment variable settings.

---

## 11. Security Checklist

| Item | Status |
|---|---|
| `VITE_SUPABASE_ANON_KEY` is the publishable key only | ✅ CONFIRMED |
| `SUPABASE_SERVICE_ROLE_KEY` does not appear anywhere in `src/` | ✅ CONFIRMED |
| `.env` is git-ignored | ✅ CONFIRMED |
| `.env.production.local` would be git-ignored | ✅ CONFIRMED |
| No `process.env` usage (Node.js) in browser code | ✅ CONFIRMED |
| No hardcoded URLs or keys in source files | ✅ CONFIRMED |
| No secrets in `vite.config.js` or `package.json` | ✅ CONFIRMED |
| `CLOCKIT_TEST_*` keys have no `VITE_` prefix — not in bundle | ✅ CONFIRMED |
| `supabase` client is `null` when env vars missing — no crash | ✅ CONFIRMED |
| Supabase auth `storageKey` is isolated from café application | ✅ CONFIRMED |

---

## 12. Summary of Findings

| Question | Answer |
|---|---|
| Exact env var names used? | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Uses `import.meta.env`? | YES — exclusively. No `process.env`. |
| Production env files supported? | YES — Vite natively supports `.env.production` and `.env.production.local` |
| `.env.production.local` git-ignored? | YES — covered by `.env.*.local` glob |
| Current `.env` points to `nook`? | YES — confirmed (`gynycspbhfoyisgcuiik`) |
| Any credentials in source code? | NO |
| Any `service_role` key exposure? | NO |
| Phase 13.6 action required? | Set production env vars in Vercel dashboard — do not commit credentials |

---

*Audit performed in read-only mode. No files were modified.*
