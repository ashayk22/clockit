# ClockIt Demo Mode Architecture

This document describes the design, sample data structure, read-only guarantees, banner indicator, and reset behaviors of ClockIt's isolated Demo Mode.

---

## 1. Diagram D: Demo-Mode Architecture Diagram

```mermaid
flowchart TD
  subgraph UserEntry ["Entry Point (/login or /signup)"]
    ClickDemo["Visitor clicks 'Explore Demo Mode'"]
  end

  subgraph DemoStore ["authStore & demoService"]
    SynthesizeUser["Assign AuthUser { id: 'usr_demo', name: 'Alex Chen', isDemo: true }"]
    PersistLocal["Write to localStorage: clockit-auth-session"]
    SeedData["loadDemoData(): Seed rich sample data into localStore"]
  end

  subgraph LocalRepositories ["Local In-Memory / LocalStorage Layer"]
    SampleWorkspaces["5 Sample Workspaces (Personal, College, Club, Freelance, Dev)"]
    SampleTasks["11 Sample Tasks across Priorities & Kanban Columns"]
    SampleFocus["5 Focus Sessions with Historical Analytics"]
    SampleHabits["8 Habits with Streaks & 31-Day Heatmap"]
    SampleCalendar["12 Calendar Events & Deadlines"]
    SampleTimeline["6 Chronological Schedule Events"]
    SampleNotes["Sample Notes & Bidirectional Graph"]
  end

  subgraph CloudSyncBoundary ["Cloud Sync Boundary (AuthContext.tsx)"]
    CheckDemo{"user.isDemo == true?"}
    BypassCloud["stopCloudSync() — Zero Network Requests to Supabase"]
  end

  subgraph UserInterface ["Dashboard User Interface"]
    DemoBanner["DemoBanner: 'DEMO MODE — Changes will not persist'"]
    ExitCTA["'Create Real Account' / 'Exit Demo' Button"]
  end

  subgraph ExitCleanup ["Exit / Sign-out Protocol"]
    ClickExit["Visitor clicks Exit Demo or Signs out"]
    ClearLocal["clearDemoData(): Wipe sample data & reset clean Personal workspace"]
    ClearSession["localStorage.removeItem('clockit-auth-session')"]
    RedirectLogin["Redirect to /signup or /login"]
  end

  ClickDemo --> SynthesizeUser
  SynthesizeUser --> PersistLocal
  PersistLocal --> SeedData
  SeedData --> LocalRepositories

  SynthesizeUser --> CheckDemo
  CheckDemo -- "isDemo is true" --> BypassCloud

  BypassCloud --> UserInterface
  UserInterface --> DemoBanner
  DemoBanner --> ExitCTA

  ExitCTA --> ClickExit
  ClickExit --> ClearLocal
  ClearLocal --> ClearSession
  ClearSession --> RedirectLogin
```

---

## 2. Technical Guarantees

### A. Zero Cloud Footprint
- Demo mode creates **no accounts in `auth.users`**.
- It writes **no rows to `clockit_*` tables**.
- Every mutating user action is restricted to the browser's local volatile storage and is never dispatched across the network.

### B. Rich Realistic Sample Dataset
Demo mode seeds realistic data for all 11 modules:
- **Workspaces**: Personal, College, Club, Freelance, Development.
- **Tasks**: 11 tasks demonstrating priorities, estimates, due dates, tags, and statuses.
- **Focus**: Sessions showing short breaks, deep work blocks, and productivity graphs.
- **Habits**: Streaks up to 28 days with a realistic 31-day heatmap.
- **Calendar & Timeline**: Rich visual events across morning and afternoon blocks.

### C. Prominent Demo Indicator
- A fixed banner at the top of the main dashboard viewport identifies Demo Mode with a distinctive badge and clear explanatory copy:
  > *"You are exploring ClockIt with sample data. No account required, and no changes are saved to the cloud."*
- Features an immediate **"Create Real Account"** CTA.

### D. Clean Exit Protocol
- Exiting demo mode or signing out triggers `clearDemoData()`, purging all sample data from `localStorage` and IndexedDB.
- Prevents sample tasks from leaking into subsequent real user sessions.
