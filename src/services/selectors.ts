/**
 * Shared task/focus derivation.
 *
 * Single source of truth for "what is today", "what is overdue" and how tasks
 * sort. Previously each of HomePage, TasksPage, Header and FocusPage carried its
 * own copy — and FocusPage's copy had drifted (it ignored the anchor-date
 * clause), so the same data produced different answers on different pages.
 */
import type { FocusSession, TaskItem, TaskPriority, TaskStatus } from '../data/mockData';
import { ANCHOR_DATE } from './taskUtils';

export type TaskFilterKey = 'all' | 'today' | 'upcoming' | 'someday' | 'completed' | 'overdue';
export type TaskSortKey = 'deadline' | 'priority' | 'workspace' | 'created' | 'status';

export const TASK_PRIORITY_RANK: Record<TaskPriority, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export const TASK_STATUS_RANK: Record<TaskStatus, number> = {
  todo: 1,
  'in-progress': 2,
  completed: 3,
};

/** A task counts as done when either flag says so — the two can disagree in stored data. */
export const isTaskCompleted = (task: TaskItem): boolean => task.completed || task.status === 'completed';

/** The canonical "is this task scheduled for the anchor day" test. */
export const isTaskToday = (task: TaskItem): boolean =>
  Boolean(task.isToday) || task.daysLeft === 'Today' || task.dueDate === ANCHOR_DATE;

export const isTaskOverdue = (task: TaskItem): boolean => Boolean(task.isOverdue) && !isTaskCompleted(task);

/**
 * Strict "coming up" test used for the overview counts: excludes anything that is
 * done, overdue, today, or undated. This is intentionally stricter than the
 * "Upcoming" filter tab, which mirrors the long-standing tab behaviour.
 */
export const isTaskUpcoming = (task: TaskItem): boolean =>
  !isTaskCompleted(task) && !task.isOverdue && !isTaskToday(task);

export const selectTodayTasks = (tasks: readonly TaskItem[]): TaskItem[] => tasks.filter(isTaskToday);

export const selectOverdueTasks = (tasks: readonly TaskItem[]): TaskItem[] => tasks.filter(isTaskOverdue);

export const selectCompletedTasks = (tasks: readonly TaskItem[]): TaskItem[] => tasks.filter(isTaskCompleted);

export const selectUpcomingTasks = (tasks: readonly TaskItem[]): TaskItem[] => tasks.filter(isTaskUpcoming);

export const selectSomedayTasks = (tasks: readonly TaskItem[]): TaskItem[] =>
  tasks.filter((task) => task.priority === 'Low' || !task.dueDate);

/** Tab predicate. Kept byte-for-byte compatible with the behaviour both pages shipped. */
export const matchesTaskFilter = (task: TaskItem, filter: TaskFilterKey): boolean => {
  switch (filter) {
    case 'today':
      return isTaskToday(task);
    case 'upcoming':
      return !task.completed && !task.isOverdue && task.daysLeft !== 'Today';
    case 'someday':
      return task.priority === 'Low' || !task.dueDate;
    case 'completed':
      return isTaskCompleted(task);
    case 'overdue':
      return Boolean(task.isOverdue) && !task.completed;
    case 'all':
    default:
      return true;
  }
};

const compareTasks = (a: TaskItem, b: TaskItem, sortBy: TaskSortKey): number => {
  if (sortBy === 'priority') return TASK_PRIORITY_RANK[b.priority] - TASK_PRIORITY_RANK[a.priority];
  if (sortBy === 'created') return (b.createdAt || 0) - (a.createdAt || 0);
  if (sortBy === 'status') return TASK_STATUS_RANK[a.status] - TASK_STATUS_RANK[b.status];
  if (sortBy === 'workspace') return a.workspace.localeCompare(b.workspace);

  // Default: 'deadline' — overdue first, then nearest due date, completed/someday last.
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return 0;
};

export const sortTasks = (tasks: readonly TaskItem[], sortBy: TaskSortKey = 'deadline'): TaskItem[] =>
  [...tasks].sort((a, b) => compareTasks(a, b, sortBy));

export const matchesTaskSearch = (task: TaskItem, query: string): boolean => {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return (
    task.title.toLowerCase().includes(q) ||
    Boolean(task.description?.toLowerCase().includes(q)) ||
    task.workspace.toLowerCase().includes(q) ||
    Boolean(task.tags?.some((tag) => tag.toLowerCase().includes(q)))
  );
};

export interface TaskQuery {
  filter?: TaskFilterKey;
  sortBy?: TaskSortKey;
  /** Exact due date (YYYY-MM-DD) selected in a mini calendar. */
  dueDate?: string | null;
  searchQuery?: string;
}

/** Filter + sort in one pass, so every page derives its list identically. */
export const selectTasks = (tasks: readonly TaskItem[], query: TaskQuery = {}): TaskItem[] => {
  let result = [...tasks];
  if (query.filter) result = result.filter((task) => matchesTaskFilter(task, query.filter as TaskFilterKey));
  if (query.dueDate) result = result.filter((task) => task.dueDate === query.dueDate);
  if (query.searchQuery) result = result.filter((task) => matchesTaskSearch(task, query.searchQuery as string));
  return sortTasks(result, query.sortBy);
};

export interface FocusStats {
  timeFocused: string;
  percentage: number;
  sessions: number;
  deepWork: string;
  lightWork: string;
}

/** Every focus figure derives from the recorded sessions — never from seed constants. */
export const selectFocusStats = (sessions: readonly FocusSession[]): FocusStats => {
  const totalSessionMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const deepWorkMinutes = sessions
    .filter((s) => s.mode === 'Deep Work')
    .reduce((acc, s) => acc + s.durationMinutes, 0);
  const lightWorkMinutes = totalSessionMinutes - deepWorkMinutes;

  return {
    timeFocused: `${Math.floor(totalSessionMinutes / 60)}h ${totalSessionMinutes % 60}m`,
    percentage: Math.min(100, Math.round((totalSessionMinutes / 240) * 100)),
    sessions: sessions.length,
    deepWork: `${Math.floor(deepWorkMinutes / 60)}h ${deepWorkMinutes % 60}m`,
    lightWork: `${Math.floor(lightWorkMinutes / 60)}h ${lightWorkMinutes % 60}m`,
  };
};

export interface TaskNotification {
  id: string;
  title: string;
  meta: string;
  kind: 'overdue' | 'today';
}

/** Notifications are derived from the user's own tasks — nothing invented. */
export const selectTaskNotifications = (tasks: readonly TaskItem[]): TaskNotification[] => [
  ...tasks
    .filter((task) => task.isOverdue && !task.completed)
    .map((task) => ({ id: task.id, title: task.title, meta: 'Overdue', kind: 'overdue' as const })),
  ...tasks
    .filter((task) => task.isToday && !task.completed)
    .map((task) => ({ id: task.id, title: task.title, meta: 'Due today', kind: 'today' as const })),
];
