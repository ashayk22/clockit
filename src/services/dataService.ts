import {
  INITIAL_WORKSPACES,
  INITIAL_TASKS,
  INITIAL_TODAY_TASKS,
  INITIAL_FOCUS_STATS,
  INITIAL_HABITS,
  HABIT_CALENDAR_DAYS,
  CALENDAR_EVENTS,
  TIMELINE_EVENTS,
  KNOWLEDGE_GRAPH_NODES,
  KNOWLEDGE_GRAPH_LINKS,
  INITIAL_QUICK_NOTES,
  TaskItem,
  Workspace,
  HabitItem,
  CalendarEvent,
  TimelineEvent,
  GraphNode,
  GraphLink,
} from '../data/mockData';

class DataService {
  private tasks: TaskItem[];
  private workspaces: Workspace[];
  private habits: HabitItem[];
  private todayTasks: typeof INITIAL_TODAY_TASKS;
  private calendarEvents: CalendarEvent[];
  private timelineEvents: TimelineEvent[];
  private quickNotes: string[];

  constructor() {
    this.tasks = this.loadFromStorage('clockit_tasks', INITIAL_TASKS);
    this.workspaces = this.loadFromStorage('clockit_workspaces', INITIAL_WORKSPACES);
    this.habits = this.loadFromStorage('clockit_habits', INITIAL_HABITS);
    this.todayTasks = this.loadFromStorage('clockit_today_tasks', INITIAL_TODAY_TASKS);
    this.calendarEvents = this.loadFromStorage('clockit_calendar_events', CALENDAR_EVENTS);
    this.timelineEvents = this.loadFromStorage('clockit_timeline_events', TIMELINE_EVENTS);
    this.quickNotes = this.loadFromStorage('clockit_quick_notes', INITIAL_QUICK_NOTES);
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

  // Workspaces
  getWorkspaces(): Workspace[] {
    return [...this.workspaces];
  }

  // Tasks
  getTasks(): TaskItem[] {
    return [...this.tasks];
  }

  toggleTask(id: string): TaskItem[] {
    this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    this.saveToStorage('clockit_tasks', this.tasks);
    return [...this.tasks];
  }

  addTask(title: string, priority: TaskItem['priority'] = 'Medium', workspace = 'Personal'): TaskItem {
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title,
      workspace,
      categoryColor: workspace === 'College' ? '#3b82f6' : '#22c55e',
      deadline: 'Upcoming',
      daysLeft: 'Soon',
      priority,
      completed: false,
    };
    this.tasks = [newTask, ...this.tasks];
    this.saveToStorage('clockit_tasks', this.tasks);
    return newTask;
  }

  // Today Tasks
  getTodayTasks() {
    return [...this.todayTasks];
  }

  toggleTodayTask(id: string) {
    this.todayTasks = this.todayTasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    this.saveToStorage('clockit_today_tasks', this.todayTasks);
    return [...this.todayTasks];
  }

  addTodayTask(title: string) {
    const item = {
      id: `td-${Date.now()}`,
      title,
      color: '#22c55e',
      deadline: 'Today',
      priority: 'Medium' as const,
      completed: false,
    };
    this.todayTasks = [...this.todayTasks, item];
    this.saveToStorage('clockit_today_tasks', this.todayTasks);
    return [...this.todayTasks];
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

  // Focus Stats
  getFocusStats() {
    return INITIAL_FOCUS_STATS;
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
