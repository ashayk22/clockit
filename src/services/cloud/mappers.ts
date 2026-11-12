/**
 * Row <-> model mapping for the cloud sync layer (Phase 12).
 *
 * The application model (camelCase, epoch-millisecond timestamps, human-readable
 * ids like `t-1` or `personal`) is mapped onto snake_case Postgres rows whose
 * primary key is a UUID. The app's own id is carried in the `client_id` column,
 * so the running app keeps using exactly the ids it always has while the cloud
 * row still gets a UUID — no id rewriting anywhere in the UI.
 */
import {
  CALENDAR_EVENTS,
  INITIAL_FOCUS_SESSIONS,
  INITIAL_HABITS,
  INITIAL_TASKS,
  INITIAL_WORKSPACES,
  TIMELINE_EVENTS,
  type CalendarEvent,
  type FocusSession,
  type HabitItem,
  type TaskItem,
  type TimelineEvent,
  type Workspace,
} from '../../data/mockData';
import type { NoteFolder, NoteItem } from '../notesStorage';
import { notesStorage } from '../notesStorage';
import { localStore } from '../repositories/storage';
import {
  calendarRepository,
  focusRepository,
  habitRepository,
  noteFolderRepository,
  noteRepository,
  taskRepository,
  workspaceRepository,
} from '../repositories';

/** Anything the sync layer can persist: it has a stable client id. */
export interface CloudEntity {
  id: string;
  userId?: string | null;
}

export type Row = Record<string, unknown>;

/**
 * Every ClockIt Supabase table.
 *
 * This project's Supabase instance is shared with an older café application
 * (cafes, favorites, menu_items, profiles, reviews), so every ClockIt table is
 * namespaced `clockit_`. The names are declared once here and imported
 * everywhere else, so an unprefixed table name cannot creep back in.
 */
export const TABLES = {
  profiles: 'clockit_profiles',
  workspaces: 'clockit_workspaces',
  tasks: 'clockit_tasks',
  focusSessions: 'clockit_focus_sessions',
  habits: 'clockit_habits',
  calendarEvents: 'clockit_calendar_events',
  timelineEvents: 'clockit_timeline_events',
  notes: 'clockit_notes',
  noteFolders: 'clockit_note_folders',
  quickNotes: 'clockit_quick_notes',
  userPreferences: 'clockit_user_preferences',
} as const;

/**
 * One syncable collection. `readLocal` / `writeLocal` are the two ends of the
 * local-first cache: reads feed the diff, writes apply a fetched cloud snapshot
 * back into the exact storage the UI already reads from.
 *
 * `table` is the single identity for a domain — it is both the Supabase table
 * and the sync engine's snapshot key, so there is no second, unprefixed name
 * that could drift out of step with the database.
 */
export interface CloudDomain<T extends CloudEntity> {
  /** Supabase table (also the diff snapshot key). */
  table: string;
  readLocal(): Promise<T[]>;
  writeLocal(records: T[]): Promise<void>;
  toRow(model: T, userId: string): Row;
  fromRow(row: Row): T;
  initialRecords?(): T[];
}

// --------------------------------------------------------------- utilities
const toIso = (ms?: number | null): string | null =>
  typeof ms === 'number' && Number.isFinite(ms) ? new Date(ms).toISOString() : null;

const fromIso = (value: unknown, fallback = Date.now()): number => {
  if (typeof value !== 'string') return fallback;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const strOrNull = (value: unknown): string | null => (typeof value === 'string' ? value : null);

const num = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const bool = (value: unknown): boolean => value === true;

const strArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

/** Writes a JSON array into a local-storage key, then asks the repository to re-read. */
function writeJsonAndRefresh<T>(key: string, records: T[], refresh: () => void): Promise<void> {
  localStore.writeJson(key, records);
  refresh();
  return Promise.resolve();
}

// ------------------------------------------------------------------ domains
export const taskDomain: CloudDomain<TaskItem> = {
  table: TABLES.tasks,
  initialRecords: () => [],
  readLocal: () => Promise.resolve(taskRepository.getAll()),
  writeLocal: (records) => writeJsonAndRefresh('clockit_tasks', records, () => taskRepository.refreshFromStorage()),
  toRow: (task, userId) => ({
    user_id: userId,
    client_id: task.id,
    title: task.title,
    description: task.description ?? null,
    workspace: task.workspace,
    category_color: task.categoryColor,
    deadline: task.deadline ?? null,
    due_date: task.dueDate ?? null,
    due_time: task.dueTime ?? null,
    days_left: task.daysLeft ?? null,
    priority: task.priority,
    status: task.status,
    completed: task.completed,
    estimate: task.estimate ?? null,
    is_today: Boolean(task.isToday),
    is_overdue: Boolean(task.isOverdue),
    tags: task.tags ?? [],
    focus_minutes: task.focusMinutes ?? 0,
    focus_sessions_count: task.focusSessionsCount ?? 0,
    created_at: toIso(task.createdAt) ?? new Date().toISOString(),
  }),
  fromRow: (row) => ({
    id: strOrNull(row.client_id) ?? String(row.id),
    userId: strOrNull(row.user_id),
    title: str(row.title) ?? 'Untitled Task',
    description: str(row.description),
    workspace: str(row.workspace) ?? 'Personal',
    categoryColor: str(row.category_color) ?? '#22c55e',
    deadline: str(row.deadline) ?? 'Upcoming',
    dueDate: str(row.due_date),
    dueTime: str(row.due_time),
    daysLeft: str(row.days_left) ?? 'Upcoming',
    priority: (str(row.priority) as TaskItem['priority']) ?? 'Medium',
    status: (str(row.status) as TaskItem['status']) ?? 'todo',
    completed: bool(row.completed),
    estimate: str(row.estimate),
    isToday: bool(row.is_today),
    isOverdue: bool(row.is_overdue),
    tags: strArray(row.tags),
    createdAt: fromIso(row.created_at),
    updatedAt: fromIso(row.updated_at),
    focusMinutes: num(row.focus_minutes),
    focusSessionsCount: num(row.focus_sessions_count),
  }),
};

export const workspaceDomain: CloudDomain<Workspace> = {
  table: TABLES.workspaces,
  initialRecords: () => [
    {
      id: 'personal',
      name: 'Personal',
      color: '#22c55e',
      description: 'Daily life, goals and routines',
      icon: 'Home',
      cover: 'personal',
    },
  ],
  readLocal: () => Promise.resolve(workspaceRepository.getAll()),
  writeLocal: (records) =>
    writeJsonAndRefresh('clockit_workspaces', records, () => workspaceRepository.refreshFromStorage()),
  toRow: (workspace, userId) => ({
    user_id: userId,
    client_id: workspace.id,
    name: workspace.name,
    color: workspace.color,
    description: workspace.description ?? null,
    icon: workspace.icon ?? null,
    cover: workspace.cover ?? null,
  }),
  fromRow: (row) => ({
    id: strOrNull(row.client_id) ?? String(row.id),
    userId: strOrNull(row.user_id),
    name: str(row.name) ?? 'Workspace',
    color: str(row.color) ?? '#6b7280',
    description: str(row.description),
    icon: str(row.icon),
    cover: str(row.cover),
  }),
};

export const focusDomain: CloudDomain<FocusSession> = {
  table: TABLES.focusSessions,
  initialRecords: () => [],
  readLocal: () => Promise.resolve(focusRepository.getAll()),
  writeLocal: (records) =>
    writeJsonAndRefresh('clockit_focus_sessions', records, () => focusRepository.refreshFromStorage()),
  toRow: (session, userId) => ({
    user_id: userId,
    client_id: session.id,
    task_id: session.taskId ?? null,
    task_title: session.taskTitle ?? null,
    mode: session.mode,
    duration_minutes: session.durationMinutes,
    completed_at: toIso(session.completedAt),
  }),
  fromRow: (row) => ({
    id: strOrNull(row.client_id) ?? String(row.id),
    userId: strOrNull(row.user_id),
    taskId: strOrNull(row.task_id),
    taskTitle: str(row.task_title),
    mode: (str(row.mode) as FocusSession['mode']) ?? 'Deep Work',
    durationMinutes: num(row.duration_minutes),
    completedAt: fromIso(row.completed_at),
  }),
};

export const habitDomain: CloudDomain<HabitItem> = {
  table: TABLES.habits,
  initialRecords: () => [],
  readLocal: () => Promise.resolve(habitRepository.getAll()),
  writeLocal: (records) =>
    writeJsonAndRefresh('clockit_habits', records, () => habitRepository.refreshFromStorage()),
  toRow: (habit, userId) => ({
    user_id: userId,
    client_id: habit.id,
    title: habit.title,
    time: habit.time,
    duration: habit.duration ?? null,
    icon_name: habit.iconName,
    completed: habit.completed,
    streak: habit.streak,
  }),
  fromRow: (row) => ({
    id: strOrNull(row.client_id) ?? String(row.id),
    userId: strOrNull(row.user_id),
    title: str(row.title) ?? 'Habit',
    time: str(row.time) ?? '',
    duration: str(row.duration),
    iconName: (str(row.icon_name) as HabitItem['iconName']) ?? 'sun',
    completed: bool(row.completed),
    streak: num(row.streak),
  }),
};

export const calendarDomain: CloudDomain<CalendarEvent> = {
  table: TABLES.calendarEvents,
  initialRecords: () => [],
  readLocal: () => Promise.resolve(calendarRepository.getEvents()),
  writeLocal: (records) =>
    writeJsonAndRefresh('clockit_calendar_events', records, () => calendarRepository.refreshFromStorage()),
  toRow: (event, userId) => ({
    user_id: userId,
    client_id: event.id,
    day: event.day,
    title: event.title,
    time: event.time,
    workspace: event.workspace,
    color: event.color,
    tag_color: event.tagColor,
  }),
  fromRow: (row) => ({
    id: strOrNull(row.client_id) ?? String(row.id),
    userId: strOrNull(row.user_id),
    day: num(row.day),
    title: str(row.title) ?? 'Event',
    time: str(row.time) ?? '',
    workspace: str(row.workspace) ?? 'Personal',
    color: str(row.color) ?? '#22c55e',
    tagColor: str(row.tag_color) ?? 'rgba(34, 197, 94, 0.15)',
  }),
};

export const timelineDomain: CloudDomain<TimelineEvent> = {
  table: TABLES.timelineEvents,
  initialRecords: () => [],
  readLocal: () => Promise.resolve(calendarRepository.getTimelineEvents()),
  writeLocal: (records) =>
    writeJsonAndRefresh('clockit_timeline_events', records, () => calendarRepository.refreshFromStorage()),
  toRow: (event, userId) => ({
    user_id: userId,
    client_id: event.id,
    time: event.time,
    title: event.title,
    subtitle: event.subtitle,
    color: event.color,
  }),
  fromRow: (row) => ({
    id: strOrNull(row.client_id) ?? String(row.id),
    userId: strOrNull(row.user_id),
    time: str(row.time) ?? '',
    title: str(row.title) ?? 'Event',
    subtitle: str(row.subtitle) ?? '',
    color: str(row.color) ?? '#6b7280',
  }),
};

export const noteDomain: CloudDomain<NoteItem> = {
  table: TABLES.notes,
  initialRecords: () => [],
  readLocal: () => notesStorage.getAllNotesIncludingTrash(),
  writeLocal: async (records) => {
    await notesStorage.replaceAllNotes(records);
    noteRepository.refreshFromStorage();
  },
  toRow: (note, userId) => ({
    user_id: userId,
    client_id: note.id,
    title: note.title,
    folder_id: note.folderId,
    content: note.content,
    tags: note.tags ?? [],
    is_favorite: note.isFavorite,
    is_trash: note.isTrash,
    is_template: note.isTemplate,
    created_at: toIso(note.createdAt) ?? new Date().toISOString(),
  }),
  fromRow: (row) => ({
    id: strOrNull(row.client_id) ?? String(row.id),
    userId: strOrNull(row.user_id),
    title: str(row.title) ?? 'Untitled Note',
    folderId: str(row.folder_id) ?? 'f-personal',
    content: str(row.content) ?? '',
    tags: strArray(row.tags),
    isFavorite: bool(row.is_favorite),
    isTrash: bool(row.is_trash),
    isTemplate: bool(row.is_template),
    createdAt: fromIso(row.created_at),
    updatedAt: fromIso(row.updated_at),
  }),
};

export const noteFolderDomain: CloudDomain<NoteFolder> = {
  table: TABLES.noteFolders,
  initialRecords: () => [],
  readLocal: () => notesStorage.getAllFolders(),
  writeLocal: async (records) => {
    await notesStorage.replaceAllFolders(records);
    noteFolderRepository.refreshFromStorage();
  },
  toRow: (folder, userId) => ({
    user_id: userId,
    client_id: folder.id,
    name: folder.name,
    color: folder.color,
    parent_id: folder.parentId ?? null,
    created_at: toIso(folder.createdAt) ?? new Date().toISOString(),
  }),
  fromRow: (row) => ({
    id: strOrNull(row.client_id) ?? String(row.id),
    userId: strOrNull(row.user_id),
    name: str(row.name) ?? 'Folder',
    color: str(row.color) ?? '#3b82f6',
    parentId: strOrNull(row.parent_id),
    createdAt: fromIso(row.created_at),
  }),
};

/** Every entity collection, in the order it is hydrated / scanned. */
export const entityDomains: readonly CloudDomain<CloudEntity>[] = [
  taskDomain,
  workspaceDomain,
  focusDomain,
  habitDomain,
  calendarDomain,
  timelineDomain,
  noteDomain,
  noteFolderDomain,
] as unknown as readonly CloudDomain<CloudEntity>[];
