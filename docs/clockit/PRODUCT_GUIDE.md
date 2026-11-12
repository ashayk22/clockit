# ClockIt Product Guide

This guide describes each user-facing module in ClockIt, explaining its core capability, where it lives in the UI, how to interact with it, and useful tips and keyboard shortcuts.

---

## 1. Dashboard (`/app`)

### Purpose
The **Dashboard** is the daily headquarters of ClockIt. It gives an immediate high-level summary of your focus time, tasks due today, active habit streaks, and upcoming events.

### Interface Layout
- **Hero Banner**: Displays greeting, current date, and primary focus actions.
- **Metric Cards**: Real-time summaries of daily focus minutes, task completion rate, and habit streak counters.
- **Immediate Priorities**: Quick overview of critical and high-priority tasks scheduled for today.
- **Daily Timeline**: Chronological view of meetings and completed focus blocks.
- **Quick Notes Scratchpad**: A rapid text entry card for transient thoughts.

### Key Workflows
- Click **"Start Deep Work"** to jump directly into the focus timer.
- Click any task checkbox to mark it completed; the metric cards update instantly.
- Type in the Quick Notes box and press `Enter` to record a scratchpad note.

---

## 2. Tasks & Kanban (`/app/tasks`)

### Purpose
Provides full task management with deadlines, priorities, time estimates, tags, and status tracking.

### Interface Layout
- **Filter Bar**: Workspace tabs, status filter (`All`, `Today`, `Upcoming`, `Someday`, `Completed`, `Overdue`), and priority filter (`Critical`, `High`, `Medium`, `Low`).
- **View Modes**: Toggle between **List View** and **Kanban Columns**.
- **Task Row / Card**: Displays title, workspace pill, priority badge, due date, estimate, and focus minute tally.

### Key Actions
- **Create Task**: Click `New Task` or press `Ctrl + N` to open the task modal. Fill in title, description, workspace, deadline, time estimate, and tags.
- **Edit / Delete Task**: Click the three-dot action button on any task row to edit details or delete.
- **Status Change**: Drag tasks across Kanban columns or toggle status in the edit modal.

---

## 3. Workspaces (`/app/workspaces`)

### Purpose
Workspaces segment tasks, habits, and calendar items by life context, preventing work projects from overwhelming personal tasks.

### Built-in Workspaces
- **Personal** (`#22c55e`): Daily goals, routines, and personal projects.
- **College** (`#3b82f6`): Courses, exams, and project submissions.
- **Club** (`#a855f7`): Organizations, extracurriculars, and event planning.
- **Freelance** (`#f97316`): Client deliverables and contracts.
- **Development** (`#10b981`): Coding experiments and side projects.

### Key Actions
- **Switch Workspace**: Click any workspace in the sidebar to filter the entire app to that domain.
- **Create Workspace**: Click `+ Add Workspace`, select an icon, accent color, name, and description.

---

## 4. Calendar & Time Blocks (`/app/calendar`)

### Purpose
A monthly, weekly, and daily visual planner showing task deadlines, time blocks, and scheduled meetings.

### Key Actions
- **Navigate Dates**: Use the arrow buttons to move across months or jump to today.
- **Inspect Day**: Click any day cell to view all scheduled events and tasks due on that date.
- **Schedule Event**: Add timed calendar events color-coded by workspace.

---

## 5. Focus & Pomodoro Timer (`/app/focus`)

### Purpose
Minimalist deep work countdown dial designed for distraction-free immersion with drift-free wall-clock precision.

### Timer Modes
- **Deep Work**: 25 to 90 minute focused sprint (default tailored via onboarding questionnaire).
- **Short Break**: 5 minute rest.
- **Long Break**: 15 minute recovery.

### Features
- **Drift-Free Accounting**: Calculates remaining and elapsed countdown from wall-clock timestamps rather than interval ticks, eliminating drift when browser tabs are backgrounded.
- **Task Association**: Link your focus session to an active task; minutes accumulate automatically into the task's `focus_minutes`.
- **Fullscreen Zen Mode**: Click the expand icon for a clean, distraction-free visual countdown.
- **Timer Settings**: Customize durations per mode; preferences persist locally and sync to cloud profile.
- **Shortcut**: `Space` to start/pause timer.

---

## 6. Habits & Consistency (`/app/habits`)

### Purpose
Track daily habits, routines, and building long-term consistency.

### Features
- **Daily Checklist**: Check off items like Morning Workout, Read 20m, Code, or Meditate.
- **Streak Tracker**: Tracks consecutive days completed with active flame icon.
- **31-Day Heatmap**: Visual ring grid showing completion status for each day of the month.

---

## 7. Notes & Knowledge Graph (`/app/notes`)

### Purpose
Personal knowledge management with rich text editing, markdown support, and bidirectional wiki-links.

### Features
- **Rich Text Editor**: Headings, task lists, code blocks, tables, and quotes.
- **Bidirectional Linking**: Type `[[Note Title]]` to link related notes together.
- **Knowledge Graph View**: Interactive node-link diagram mapping notes and their interconnected concepts.
- **Favorites & Trash**: Star essential reference notes or restore discarded notes from trash.

---

## 8. Note Folders (`/app/notes`)

### Purpose
Hierarchical folder structure organizing notes across projects and academic subjects.

### Key Actions
- **Create Folder**: Click the `+` icon in the notes sidebar, choose a parent folder and color tag.
- **Move Notes**: Select a destination folder from the note editor toolbar.

---

## 9. Quick Notes Scratchpad

### Purpose
Instant scratchpad available on the dashboard for ephemeral notes, URLs, or quick phone numbers.

### Key Actions
- **Inline Capture**: Type in the scratchpad box on the dashboard and hit `Enter` to save instantly.
- **Expanded Canvas**: Click the expand icon to open `QuickNotesModal` for a larger brainstorming and drafting canvas.
- **Inline Editing & Deletion**: Click any note to edit directly or tap trash to remove. Auto-persists locally and syncs to cloud profile.

---

## 10. Chronological Timeline

### Purpose
Hour-by-hour view of today's schedule correlating workouts, lectures, focus blocks, and meetings.

---

## 11. Preferences & Settings (`/app/settings`)

### Purpose
Theme selection, account identity, personalization questionnaire editing, and onboarding tutorial access.

### Controls
- **Account Identity**: Edit and save display name with validation (eradicates email prefix fallbacks).
- **Theme Switcher**: Choose between Warm Light, Deep Dark, or automatic System mode.
- **Personalization Profile**: Review or retake the onboarding questionnaire to update daily challenge tags and timer defaults.
- **Feature Guides**: Launch the interactive tutorial directory or reset and replay walkthroughs.
