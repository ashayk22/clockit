import {
  INITIAL_WORKSPACES,
  INITIAL_TASKS,
  INITIAL_FOCUS_SESSIONS,
  INITIAL_HABITS,
  HABIT_CALENDAR_DAYS,
  CALENDAR_EVENTS,
  TIMELINE_EVENTS,
  KNOWLEDGE_GRAPH_NODES,
  KNOWLEDGE_GRAPH_LINKS,
  INITIAL_QUICK_NOTES,
  TaskItem,
  FocusSession,
  Workspace,
  HabitItem,
  CalendarEvent,
  TimelineEvent,
  GraphNode,
  GraphLink,
} from '../data/mockData';

export const ANCHOR_DATE = '2026-10-26'; // Sun, 26 Oct 2026 (matching ClockIt reference design anchor)

export const WORKSPACE_COLORS: Record<string, string> = {
  Personal: '#22c55e',
  College: '#3b82f6',
  Club: '#a855f7',
  Freelance: '#f97316',
  Development: '#10b981',
  SIH: '#10b981',
};

export const formatDeadlineString = (dueDateStr?: string, dueTimeStr?: string): string => {
  if (!dueDateStr) return 'No deadline';
  try {
    const parts = dueDateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = months[month - 1] || 'Oct';
      const base = `${day} ${monthName} ${year}`;
      if (dueTimeStr) {
        return `${base}, ${dueTimeStr}`;
      }
      return base;
    }
    return dueDateStr;
  } catch {
    return dueDateStr;
  }
};

export const computeDaysDiff = (dueDateStr?: string): { daysLeft: string; isOverdue: boolean; isToday: boolean } => {
  if (!dueDateStr) return { daysLeft: 'Someday', isOverdue: false, isToday: false };
  try {
    const target = new Date(dueDateStr + 'T00:00:00');
    const anchor = new Date(ANCHOR_DATE + 'T00:00:00');
    const diffTime = target.getTime() - anchor.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return {
        daysLeft: `${Math.abs(diffDays)} days overdue`,
        isOverdue: true,
        isToday: false,
      };
    } else if (diffDays === 0) {
      return {
        daysLeft: 'Today',
        isOverdue: false,
        isToday: true,
      };
    } else if (diffDays === 1) {
      return {
        daysLeft: 'Tomorrow',
        isOverdue: false,
        isToday: false,
      };
    } else {
      return {
        daysLeft: `${diffDays} days left`,
        isOverdue: false,
        isToday: false,
      };
    }
  } catch {
    return { daysLeft: 'Upcoming', isOverdue: false, isToday: false };
  }
};

class DataService {
  private tasks: TaskItem[];
  private workspaces: Workspace[];
  private habits: HabitItem[];
  private calendarEvents: CalendarEvent[];
  private timelineEvents: TimelineEvent[];
  private quickNotes: string[];
  private focusSessions: FocusSession[];
  private selectedFocusTaskId: string | null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    const rawTasks = this.loadFromStorage('clockit_tasks', INITIAL_TASKS);
    this.tasks = rawTasks.map((t, idx) => this.normalizeTask(t, idx));
    this.workspaces = this.loadFromStorage('clockit_workspaces', INITIAL_WORKSPACES);
    this.habits = this.loadFromStorage('clockit_habits', INITIAL_HABITS);
    this.calendarEvents = this.loadFromStorage('clockit_calendar_events', CALENDAR_EVENTS);
    this.timelineEvents = this.loadFromStorage('clockit_timeline_events', TIMELINE_EVENTS);
    this.quickNotes = this.loadFromStorage('clockit_quick_notes', INITIAL_QUICK_NOTES);
    this.focusSessions = this.loadFromStorage('clockit_focus_sessions', INITIAL_FOCUS_SESSIONS);
    this.selectedFocusTaskId = this.loadFromStorage('clockit_selected_focus_task_id', 't-1');

    // Save normalized tasks back to storage
    this.saveToStorage('clockit_tasks', this.tasks);
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = localStorage.getItem(key);
        if (item) return JSON.parse(item);
      }
    } catch (e) {
      console.warn(`Error loading ${key} from storage:`, e);
    }
    return fallback;
  }

  private saveToStorage<T>(key: string, value: T): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn(`Error saving ${key} to storage:`, e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in dataService listener:', err);
      }
    });
  }

  private normalizeTask(raw: any, index = 0): TaskItem {
    const status: TaskItem['status'] = raw.status || (raw.completed ? 'completed' : 'todo');
    const completed = status === 'completed' || Boolean(raw.completed);

    let daysLeft = raw.daysLeft || 'Upcoming';
    let isOverdue = Boolean(raw.isOverdue);
    let isToday = Boolean(raw.isToday);
    let deadline = raw.deadline || 'Upcoming';

    if (raw.dueDate) {
      const diff = computeDaysDiff(raw.dueDate);
      daysLeft = diff.daysLeft;
      isOverdue = diff.isOverdue && !completed;
      isToday = diff.isToday;
      deadline = formatDeadlineString(raw.dueDate, raw.dueTime);
    } else if (raw.deadline && raw.deadline.includes('overdue')) {
      isOverdue = !completed;
    }

    const workspace = raw.workspace || 'Personal';
    const categoryColor = raw.categoryColor || WORKSPACE_COLORS[workspace] || '#22c55e';

    return {
      id: raw.id || `task-${Date.now()}-${index}`,
      title: raw.title || 'Untitled Task',
      description: raw.description || '',
      workspace,
      categoryColor,
      deadline,
      dueDate: raw.dueDate,
      dueTime: raw.dueTime,
      daysLeft,
      priority: raw.priority || 'Medium',
      status,
      completed,
      estimate: raw.estimate || '1 hr',
      isToday,
      isOverdue,
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      createdAt: raw.createdAt || Date.now() - index * 3600000,
      updatedAt: raw.updatedAt || Date.now(),
      focusMinutes: raw.focusMinutes || 0,
      focusSessionsCount: raw.focusSessionsCount || 0,
    };
  }

  // Workspaces
  getWorkspaces(): Workspace[] {
    return [...this.workspaces];
  }

  // Tasks Management
  getTasks(): TaskItem[] {
    return [...this.tasks];
  }

  getTaskById(id: string): TaskItem | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  addTask(data: Partial<TaskItem>): TaskItem {
    const now = Date.now();
    const workspace = data.workspace || 'Personal';
    const categoryColor = data.categoryColor || WORKSPACE_COLORS[workspace] || '#22c55e';
    const priority = data.priority || 'Medium';
    const status = data.status || 'todo';
    const completed = status === 'completed';

    let daysLeft = data.daysLeft || 'Upcoming';
    let isOverdue = false;
    let isToday = Boolean(data.isToday);
    let deadline = data.deadline || 'Upcoming';

    if (data.dueDate) {
      const diff = computeDaysDiff(data.dueDate);
      daysLeft = diff.daysLeft;
      isOverdue = diff.isOverdue && !completed;
      isToday = diff.isToday || isToday;
      deadline = formatDeadlineString(data.dueDate, data.dueTime);
    }

    const newTask: TaskItem = {
      id: `task-${now}-${Math.random().toString(36).substring(2, 6)}`,
      title: (data.title || 'Untitled Task').trim(),
      description: data.description?.trim() || '',
      workspace,
      categoryColor,
      deadline,
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      daysLeft,
      priority,
      status,
      completed,
      estimate: data.estimate || '1–2 hrs',
      isToday,
      isOverdue,
      tags: Array.isArray(data.tags) ? data.tags : [],
      createdAt: now,
      updatedAt: now,
      focusMinutes: 0,
      focusSessionsCount: 0,
    };

    this.tasks = [newTask, ...this.tasks];
    this.saveToStorage('clockit_tasks', this.tasks);
    this.notify();
    return newTask;
  }

  updateTask(id: string, updates: Partial<TaskItem>): TaskItem {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Task ${id} not found`);

    const existing = this.tasks[index];
    let status = updates.status !== undefined ? updates.status : existing.status;
    let completed = updates.completed !== undefined ? updates.completed : existing.completed;

    if (updates.status !== undefined && updates.completed === undefined) {
      completed = status === 'completed';
    } else if (updates.completed !== undefined && updates.status === undefined) {
      status = completed ? 'completed' : existing.status === 'completed' ? 'todo' : existing.status;
    }

    const dueDate = updates.dueDate !== undefined ? updates.dueDate : existing.dueDate;
    const dueTime = updates.dueTime !== undefined ? updates.dueTime : existing.dueTime;
    let deadline = updates.deadline !== undefined ? updates.deadline : existing.deadline;
    let daysLeft = updates.daysLeft !== undefined ? updates.daysLeft : existing.daysLeft;
    let isOverdue = updates.isOverdue !== undefined ? updates.isOverdue : existing.isOverdue;
    let isToday = updates.isToday !== undefined ? updates.isToday : existing.isToday;

    if (dueDate) {
      const diff = computeDaysDiff(dueDate);
      daysLeft = diff.daysLeft;
      isOverdue = diff.isOverdue && !completed;
      isToday = diff.isToday;
      deadline = formatDeadlineString(dueDate, dueTime);
    } else if (completed) {
      isOverdue = false;
    }

    const workspace = updates.workspace || existing.workspace;
    const categoryColor = updates.categoryColor || WORKSPACE_COLORS[workspace] || existing.categoryColor;

    const updated: TaskItem = {
      ...existing,
      ...updates,
      workspace,
      categoryColor,
      status,
      completed,
      dueDate,
      dueTime,
      deadline,
      daysLeft,
      isOverdue,
      isToday,
      updatedAt: Date.now(),
    };

    this.tasks[index] = updated;
    this.saveToStorage('clockit_tasks', this.tasks);
    this.notify();
    return updated;
  }

  toggleTask(id: string): TaskItem[] {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      const nextCompleted = !task.completed;
      const nextStatus: TaskItem['status'] = nextCompleted ? 'completed' : 'todo';
      this.updateTask(id, { completed: nextCompleted, status: nextStatus });
    }
    return [...this.tasks];
  }

  deleteTask(id: string): void {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    if (this.selectedFocusTaskId === id) {
      this.selectedFocusTaskId = null;
      this.saveToStorage('clockit_selected_focus_task_id', null);
    }
    this.saveToStorage('clockit_tasks', this.tasks);
    this.notify();
  }

  // Today Tasks (Unified with main task store)
  getTodayTasks(): TaskItem[] {
    return this.tasks.filter((t) => t.isToday || t.daysLeft === 'Today' || t.dueDate === ANCHOR_DATE);
  }

  toggleTodayTask(id: string): TaskItem[] {
    this.toggleTask(id);
    return this.getTodayTasks();
  }

  addTodayTask(title: string): TaskItem[] {
    this.addTask({
      title,
      isToday: true,
      deadline: 'Today',
      daysLeft: 'Today',
      dueDate: ANCHOR_DATE,
      priority: 'Medium',
      workspace: 'Personal',
    });
    return this.getTodayTasks();
  }

  // Focus Integration
  getSelectedFocusTaskId(): string | null {
    if (this.selectedFocusTaskId) {
      const exists = this.tasks.some((t) => t.id === this.selectedFocusTaskId);
      if (!exists) {
        this.selectedFocusTaskId = null;
        this.saveToStorage('clockit_selected_focus_task_id', null);
      }
    }
    return this.selectedFocusTaskId;
  }

  setSelectedFocusTaskId(id: string | null): void {
    this.selectedFocusTaskId = id;
    this.saveToStorage('clockit_selected_focus_task_id', id);
    this.notify();
  }

  recordFocusSession(session: {
    taskId?: string | null;
    taskTitle?: string;
    mode: 'Deep Work' | 'Short Break' | 'Long Break';
    durationMinutes: number;
  }): FocusSession {
    const task = session.taskId ? this.getTaskById(session.taskId) : undefined;
    const newSession: FocusSession = {
      id: `fs-${Date.now()}`,
      taskId: session.taskId || null,
      taskTitle: session.taskTitle || task?.title || 'General Session',
      mode: session.mode,
      durationMinutes: session.durationMinutes,
      completedAt: Date.now(),
    };

    this.focusSessions = [newSession, ...this.focusSessions];
    this.saveToStorage('clockit_focus_sessions', this.focusSessions);

    if (session.taskId && task) {
      this.updateTask(session.taskId, {
        focusMinutes: (task.focusMinutes || 0) + session.durationMinutes,
        focusSessionsCount: (task.focusSessionsCount || 0) + 1,
      });
    } else {
      this.notify();
    }

    return newSession;
  }

  getFocusSessions(): FocusSession[] {
    return [...this.focusSessions];
  }

  // Habits
  getHabits(): HabitItem[] {
    return [...this.habits];
  }

  toggleHabit(id: string): HabitItem[] {
    this.habits = this.habits.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h));
    this.saveToStorage('clockit_habits', this.habits);
    return [...this.habits];
  }

  getHabitCalendarDays() {
    return HABIT_CALENDAR_DAYS;
  }

  // Calendar
  getCalendarEvents(): CalendarEvent[] {
    return [...this.calendarEvents];
  }

  addCalendarEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const newEvent: CalendarEvent = {
      ...event,
      id: `ce-${Date.now()}`,
    };
    this.calendarEvents = [...this.calendarEvents, newEvent];
    this.saveToStorage('clockit_calendar_events', this.calendarEvents);
    return newEvent;
  }

  getTimelineEvents(): TimelineEvent[] {
    return [...this.timelineEvents];
  }

  // Knowledge Graph
  getGraphNodes(): GraphNode[] {
    return KNOWLEDGE_GRAPH_NODES;
  }

  getGraphLinks(): GraphLink[] {
    return KNOWLEDGE_GRAPH_LINKS;
  }

  // Focus Stats — derived entirely from the recorded sessions, never seeded constants.
  getFocusStats() {
    const totalSessionMinutes = this.focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const deepWorkMinutes = this.focusSessions
      .filter((s) => s.mode === 'Deep Work')
      .reduce((acc, s) => acc + s.durationMinutes, 0);
    const lightWorkMinutes = totalSessionMinutes - deepWorkMinutes;
    const hours = Math.floor(totalSessionMinutes / 60);
    const mins = totalSessionMinutes % 60;
    const deepH = Math.floor(deepWorkMinutes / 60);
    const deepM = deepWorkMinutes % 60;

    return {
      timeFocused: `${hours}h ${mins}m`,
      percentage: Math.min(100, Math.round((totalSessionMinutes / 240) * 100)),
      sessions: this.focusSessions.length,
      deepWork: `${deepH}h ${deepM}m`,
      lightWork: `${Math.floor(lightWorkMinutes / 60)}h ${lightWorkMinutes % 60}m`,
    };
  }

  // Quick Notes
  getQuickNotes(): string[] {
    return [...this.quickNotes];
  }

  addQuickNote(note: string) {
    if (!note.trim()) return this.quickNotes;
    this.quickNotes = [note.trim(), ...this.quickNotes];
    this.saveToStorage('clockit_quick_notes', this.quickNotes);
    return this.quickNotes;
  }
}

export const dataService = new DataService();
