# ClockIt System Architecture

This document specifies the technical architecture of ClockIt, covering frontend layout, local repository layer, data synchronization engine, Supabase integration, and shared database coexistence.

---

## 1. High-Level Architectural Decomposition

ClockIt follows a **local-first reactive architecture**. The user interface reads and writes exclusively to local repository abstractions, providing instantaneous UI response times with zero perceived network latency. A background cloud synchronization engine observes repository writes, computes delta changes against cached snapshots, and idempotently reconciles rows with Supabase via Row-Level Security (RLS).

---

## 2. Diagram A: Overall System Architecture

```mermaid
flowchart TD
  subgraph Presentation ["Presentation Layer (React 19 + TypeScript + Vite)"]
    UI["Dashboard / Tasks / Workspaces / Calendar / Focus / Habits / Notes / Analytics / Settings"]
    Header["Header Chrome & Quick Search"]
    Sidebar["Collapsible Sidebar Navigation"]
    OnboardingUI["Sequential 11-Page Tour (ReactDOM.createPortal into document.body)"]
    WizardUI["Personalization Questionnaire (/onboarding)"]
    Toasts["Watermelon Alert 4 Transient Notifications"]
    DemoUI["Demo Mode Indicator & Toast Guard"]
  end

  subgraph StateAndAuth ["State & Authentication"]
    AuthContext["AuthContext & authStore (Full Name capture & display name sanitization)"]
    ThemeContext["ThemeContext (Light / Dark / System)"]
    DataService["dataService Event Bus (Observer Pattern)"]
  end

  subgraph RepositoryLayer ["Local Repository Layer"]
    TaskRepo["taskRepository"]
    WorkspaceRepo["workspaceRepository"]
    FocusRepo["focusRepository (Drift-free wall-clock timestamps)"]
    HabitRepo["habitRepository"]
    CalendarRepo["calendarRepository"]
    NotesRepo["notesRepository (IndexedDB)"]
    QuickNotesRepo["quickNotes in dataService (Dual-storage cloud fallback)"]
    PrefsRepo["preferencesRepository (LocalStorage)"]
  end

  subgraph CloudSyncLayer ["Cloud Synchronization Engine"]
    SyncEngine["syncEngine.ts (Debounced Scanner & Hydration)"]
    Queue["Offline Sync Queue (FIFO)"]
    Mappers["mappers.ts (CamelCase <-> SnakeCase)"]
  end

  subgraph SupabaseCloud ["Supabase PostgreSQL (Project: nook)"]
    subgraph ClockItTables ["Namespaced ClockIt Tables (RLS Enforced)"]
      T1["clockit_profiles"]
      T2["clockit_workspaces"]
      T3["clockit_tasks"]
      T4["clockit_focus_sessions"]
      T5["clockit_habits"]
      T6["clockit_calendar_events"]
      T7["clockit_timeline_events"]
      T8["clockit_notes"]
      T9["clockit_note_folders"]
      T10["clockit_quick_notes"]
      T11["clockit_user_preferences"]
    end

    subgraph CafeApp ["Coexisting Cafe App Tables (Untouched)"]
      C1["cafes"]
      C2["favorites"]
      C3["menu_items"]
      C4["profiles"]
      C5["reviews"]
    end
  end

  UI --> DataService
  UI --> AuthContext
  UI --> OnboardingUI
  DataService --> RepositoryLayer
  AuthContext --> SyncEngine
  RepositoryLayer -.-> SyncEngine
  SyncEngine --> Queue
  Queue --> Mappers
  Mappers --> ClockItTables
```

---

## 3. Layer Breakdown

### A. Presentation Layer
- **Component Architecture**: Built with functional React components, strict TypeScript interfaces, and scoped CSS files.
- **Routing**: `react-router-dom` with `/` (landing), `/login`, `/signup`, `/onboarding` (first-time personalization), and protected `/app/*` routes wrapped in `ProtectedRoute`.
- **Transitions**: Smooth page routing transitions via `PageTransition` and branded `LoginTransition`.
- **Notifications**: Standardized transient notifications adhering to Watermelon Alert 4 specification (`NotificationToast.tsx`) with teal border, status icons, and theme compatibility.

### B. Reactive Data Layer
- **`dataService`**: Central event dispatcher using the Observer pattern. When any repository mutates data, `dataService.notify()` triggers listeners across active components.
- **Repositories**: Standardized CRUD interfaces (`taskRepository`, `workspaceRepository`, etc.) abstracting physical storage (`localStorage` vs IndexedDB).
- **Focus Timer**: High-precision wall-clock countdown engine with drift-free elapsed calculation (`performance.now()` delta), modes (Deep Work, Short Break, Long Break), custom settings, and fullscreen Zen mode. Music widget has been excised.
- **Quick Notes**: Instant thought capture via `QuickNotesCard` on the dashboard and `QuickNotesModal` for full-screen expanded drafting.

### C. Cloud Sync Layer
- **Local-First Diffing**: Takes in-memory snapshots of each table signature. When a mutation occurs, the diff engine identifies the changed entity and enqueues an upsert or delete.
- **Dual-Storage Fallback**: Quick notes and personalization fields are stored in their primary tables with a mirrored fallback in `clockit_user_preferences`, ensuring offline reliability.
- **Client ID Mapping**: Internal client IDs (`t-1`, `personal`) are preserved in the `client_id` column of the PostgreSQL table, while Supabase assigns unique `uuid` primary keys.
- **Conflict Free**: Every upsert uses `onConflict: 'user_id,client_id'` to guarantee idempotent re-runs.

### D. Multi-Tenant Database Boundary
- **Isolated Tables**: All 11 tables prefixed with `clockit_`.
- **RLS Boundary**: `auth.uid() = user_id` ensures that even with the anon key, no user can read, insert, update, or delete records belonging to another tenant or the coexisting café app.
