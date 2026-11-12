# ClockIt Security & Data Isolation Architecture

This document describes the multi-tenant isolation model, Row-Level Security policies, authentication guarantees, token security, and the strict boundary protecting the coexisting café database.

---

## 1. Diagram G: RLS and Multi-Tenant Security Diagram

```mermaid
flowchart TD
  subgraph ClientEnvironment ["Client Environment (Browser)"]
    UserAClient["User A (streetlight350@gmail.com)<br/>JWT: sub = 94c6f41f..."]
    UserBClient["User B (ashay22306@gmail.com)<br/>JWT: sub = c5df88a3..."]
    VisitorClient["Anonymous / Demo Visitor<br/>Local Volatile State (No JWT)"]
  end

  subgraph SupabaseGateway ["Supabase API Gateway (PostgREST)"]
    AnonKeyFilter["Publishable Anon Key Verification"]
    JWTExtractor["Extract auth.uid() from validated JWT"]
  end

  subgraph PostgresKernel ["PostgreSQL Kernel (nook)"]
    subgraph RLSControl ["Row-Level Security Engine"]
      RuleCheck{"Enforce RLS: auth.uid() = user_id"}
    end

    subgraph ClockItData ["ClockIt Tables (clockit_*)"]
      UserARows["User A Records<br/>(user_id = 94c6f41f...)"]
      UserBRows["User B Records<br/>(user_id = c5df88a3...)"]
    end

    subgraph CafeData ["Cafe Application Tables (cafe_*)"]
      CafeRows["profiles, cafes, favorites, menu_items, reviews<br/>Protected by Cafe RLS Policies"]
    end
  end

  UserAClient -- "Request with User A JWT" --> JWTExtractor
  UserBClient -- "Request with User B JWT" --> JWTExtractor
  VisitorClient -- "BLOCKED: Zero Cloud Network Calls" -.-> ClientEnvironment

  JWTExtractor --> RuleCheck

  RuleCheck -- "auth.uid() == 94c6f41f" --> UserARows
  RuleCheck -- "DENIED: Cannot read or write User B" -.X UserBRows

  RuleCheck -- "auth.uid() == c5df88a3" --> UserBRows
  RuleCheck -- "DENIED: Cannot read or write User A" -.X UserARows

  RuleCheck -- "DENIED: No ClockIt queries touch Cafe Tables" -.X CafeRows
```

---

## 2. Security Invariants

### 1. `auth.uid() = user_id` Enforcement
- Every single ClockIt table contains a non-nullable `user_id uuid references auth.users (id)`.
- The RLS policy applies to `all` actions (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) with both `using (auth.uid() = user_id)` and `with check (auth.uid() = user_id)`.
- Even if a malicious client attempts to forge an insert with another user's `user_id`, PostgreSQL rejects the transaction immediately.

### 2. Zero Service-Role Exposure
- The frontend codebase uses **strictly** `VITE_SUPABASE_ANON_KEY`.
- No service-role key or database admin secret is present in frontend builds or git repositories.

### 3. Coexistence Security (Café App Protection)
- The Supabase database is shared with an older café app.
- ClockIt never drops, alters, renames, or executes DDL on café tables (`cafes`, `favorites`, `menu_items`, `profiles`, `reviews`).
- ClockIt functions are prefixed `clockit_` (`clockit_set_updated_at`, `clockit_handle_new_user`).
- ClockIt triggers are prefixed `clockit_` (`clockit_on_auth_user_created`).
- The café app's own authentication triggers and user data remain completely isolated and functional.

### 4. Demo Mode Isolation Guarantee
- Visitors in Demo Mode operate with a synthetic local profile (`usr_demo`).
- `startCloudSync` is never invoked, preventing any network requests or accidental writes to Supabase.
