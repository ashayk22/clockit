# ClockIt — Comprehensive Technical Documentation

> **One focused workspace for time, tasks, attention, and personal knowledge.**

---

## 1. Product Overview

**ClockIt** is an integrated productivity application designed for makers, students, and engineers. Rather than scattering focus across disparate tools, ClockIt unifies:

- **Deep Work Focus Timer**: Pomodoro intervals, custom durations, ambient audio soundscapes, and session tracking.
- **Task Prioritization & Kanban**: Deadline intelligence, priority classification (Critical, High, Medium, Low), time estimates, and tag-based categorization.
- **Multi-Workspace Isolation**: Workspaces for Personal, Academics/College, Clubs, Freelance, and Engineering side projects.
- **Monthly & Weekly Calendar**: Unified schedule correlating task deadlines, scheduled meetings, and focused time blocks.
- **Habit Tracker & Heatmap**: Daily consistency tracking with streak counters and a 31-day activity heatmap.
- **Rich Notes & Knowledge Graph**: Local markdown notes, checklist blocks, bidirectional `[[wiki-linking]]`, and visual knowledge graph mapping.
- **Quick Notes Scratchpad**: Rapid ephemeral idea capture accessible across the entire application.
- **Chronological Timeline**: Daily hour-by-hour view of all scheduled events and focus blocks.

---

## 2. Core Architecture Principles

1. **Local-First with Cloud Synchronization**:
   - ClockIt operates immediately with zero boot latency by reading and writing to local repository storage (`localStorage` and IndexedDB).
   - In cloud mode, background synchronization diffs local snapshots against Supabase (`clockit_*` namespaced tables) and flushes mutations idempotently with `upsert on conflict (user_id, client_id)`.
2. **Strict Multi-Tenant Coexistence**:
   - The development Supabase instance (`nook`) is shared with a legacy café application (`cafes`, `favorites`, `menu_items`, `profiles`, `reviews`).
   - Every ClockIt table is namespaced with the prefix `clockit_`.
   - Every ClockIt table enforces Row-Level Security (RLS) with `auth.uid() = user_id`.
   - ClockIt triggers and helpers are uniquely prefixed (e.g., `clockit_handle_new_user`, `clockit_set_updated_at`) to prevent collision with external databases.
3. **Isolated Read-Only Demo Architecture**:
   - Visitors can explore ClockIt with rich sample data without an account.
   - Demo mode operates in memory/volatile local state with zero network writes to Supabase.
4. **Idempotent New-User Initialization**:
   - Brand new accounts are bootstrapped cleanly with a single default "Personal" workspace, clean preferences, and zero sample data residue.

---

## 3. Documentation Index

The technical documentation in `docs/clockit/` provides deep-dive architectural specifications:

| Document | Description | Diagrams Included |
| :--- | :--- | :--- |
| [PRODUCT_GUIDE.md](file:///c:/Users/ashay/Desktop/programs/web%20dev/tracker/docs/clockit/PRODUCT_GUIDE.md) | Feature-by-feature end-user guide and keyboard shortcuts | — |
| [SYSTEM_ARCHITECTURE.md](file:///c:/Users/ashay/Desktop/programs/web%20dev/tracker/docs/clockit/SYSTEM_ARCHITECTURE.md) | Full stack architecture, layer decomposition, data flows | Diagram A (Overall System Architecture) |
| [AUTHENTICATION_FLOW.md](file:///c:/Users/ashay/Desktop/programs/web%20dev/tracker/docs/clockit/AUTHENTICATION_FLOW.md) | Sign-up, login, session recovery, and bootstrap trigger | Diagram B (Authentication & Signup Flowchart) |
| [DATABASE_ARCHITECTURE.md](file:///c:/Users/ashay/Desktop/programs/web%20dev/tracker/docs/clockit/DATABASE_ARCHITECTURE.md) | Schema specs for all 11 `clockit_*` tables, indexes, RLS | Diagram F (Entity Relationship Diagram) |
| [DATA_SYNCHRONIZATION.md](file:///c:/Users/ashay/Desktop/programs/web%20dev/tracker/docs/clockit/DATA_SYNCHRONIZATION.md) | Local-first replication, diff engine, offline queue, hydration | Diagram E (Data Synchronization Flowchart) |
| [SECURITY_ARCHITECTURE.md](file:///c:/Users/ashay/Desktop/programs/web%20dev/tracker/docs/clockit/SECURITY_ARCHITECTURE.md) | Multi-tenant isolation, RLS rules, token storage, threat model | Diagram G (RLS & Multi-User Security) |
| [DEMO_MODE.md](file:///c:/Users/ashay/Desktop/programs/web%20dev/tracker/docs/clockit/DEMO_MODE.md) | Zero-cloud demo architecture, sample data, read-only guard | Diagram D (Demo Mode Architecture) |
| [ONBOARDING_GUIDE.md](file:///c:/Users/ashay/Desktop/programs/web%20dev/tracker/docs/clockit/ONBOARDING_GUIDE.md) | 11 interactive walkthroughs, spotlight UI, progress sync | Diagram C (New-User Initialization Flowchart) |
| [DEPLOYMENT_GUIDE.md](file:///c:/Users/ashay/Desktop/programs/web%20dev/tracker/docs/clockit/DEPLOYMENT_GUIDE.md) | Vite build, environment variables, Supabase provisioning | Diagram I (Deployment Architecture) |
| [MAINTENANCE_GUIDE.md](file:///c:/Users/ashay/Desktop/programs/web%20dev/tracker/docs/clockit/MAINTENANCE_GUIDE.md) | Troubleshooting, test harness, account cleanup manifest | Diagram H (Module Relationships Diagram) |

---

## 4. Implementation Status Matrix

| Capability / Module | Status | Verification Summary |
| :--- | :---: | :--- |
| **Namespaced Database (11 tables)** | **PASS** | Migration `0001_init.sql` deployed and verified with RLS. |
| **Authentication & Sessions** | **PASS** | Supabase GoTrue + Full Name capture, confirm password, persistent sessions. |
| **Personalization Setup (`/onboarding`)** | **PASS** | 3-step questionnaire, duration preferences, skip support, profile editing. |
| **Cloud Synchronization** | **PASS** | Local-first sync engine with debounced diffing and dual-storage fallback. |
| **Multi-Tenant Isolation (RLS)** | **PASS** | User A cannot read, update, or delete User B's rows (empirically tested). |
| **Sequential Product Tour (11 pages)** | **PASS** | 48 steps, portal-mounted topmost layer, smooth spotlight box cutout, mobile docked. |
| **Drift-Free Focus Timer** | **PASS** | Wall-clock elapsed accounting, task-linking, settings modal, Zen mode. |
| **Quick Notes Scratchpad** | **PASS** | Inline dashboard card + expanded modal, local & cloud persistence. |
| **Transient Notifications** | **PASS** | Watermelon Alert 4 UI specification with status icons and auto-dismissal. |
| **Isolated Demo Mode** | **PASS** | Zero cloud writes, sample data isolation, clear demo indicators. |
| **Database Coexistence (Migration 0002)**| **PASS** | Strictly `clockit_*` scoped; zero cafe table or trigger interference. |
| **Technical Documentation** | **PASS** | 11 comprehensive architecture guides and Mermaid diagrams. |
