/**
 * Application data facade.
 *
 * The public API is unchanged on purpose (Phase 11 §1: "preserve the existing
 * data service API where practical to minimize component changes") — every
 * method now delegates to a repository instead of touching `localStorage`
 * itself, so the UI no longer has any storage knowledge.
 */
import {
  KNOWLEDGE_GRAPH_LINKS,
  KNOWLEDGE_GRAPH_NODES,
  type CalendarEvent,
  type FocusSession,
  type GraphLink,
  type GraphNode,
  type HabitDayState,
  type HabitItem,
  type TaskItem,
  type TimelineEvent,
  type Workspace,
} from '../data/mockData';
import { ANCHOR_DATE, WORKSPACE_COLORS, computeDaysDiff, formatDeadlineString } from './taskUtils';
import { selectFocusStats } from './selectors';
import {
  calendarRepository,
  focusRepository,
  habitRepository,
  noteRepository,
  noteFolderRepository,
  preferencesRepository,
  repositories,
  storageIssues,
  taskRepository,
  workspaceRepository,
  type StorageIssue,
} from './repositories';

// Re-exported so the existing `from '../../services/dataService'` imports across
// the app keep resolving exactly as before.
export { ANCHOR_DATE, WORKSPACE_COLORS, computeDaysDiff, formatDeadlineString };

/** Shape accepted by `recordFocusSession` — kept from the previous implementation. */
export interface FocusSessionRecordInput {
  taskId?: string | null;
  taskTitle?: string;
  mode: FocusSession['mode'];
  durationMinutes: number;
}

class DataService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    // One subscription to every repository: a local mutation and a write from
    // another tab both end up here, so components re-read through one channel.
    repositories.forEach((repository) => {
      repository.subscribe(() => this.notify());
    });
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

  /**
   * Storage problems collected so far (corrupt payloads, failed writes).
   * Exposed so a future UI can surface them; nothing is silently swallowed
   * (Phase 11 §5).
   */
  public getStorageIssues(): StorageIssue[] {
    return storageIssues.all();
  }

  public subscribeToStorageIssues(listener: (issue: StorageIssue) => void): () => void {
    return storageIssues.subscribe(listener);
  }

  // Workspaces
  getWorkspaces(): Workspace[] {
    return workspaceRepository.getAll();
  }

  getWorkspaceById(id: string): Workspace | undefined {
    return workspaceRepository.getById(id);
  }

  addWorkspace(data: Partial<Workspace> & { name: string }): Workspace {
    return workspaceRepository.create(data);
  }

  updateWorkspace(id: string, updates: Partial<Workspace>): Workspace | undefined {
    const current = workspaceRepository.getById(id);
    if (!current) return undefined;
    const updated = workspaceRepository.update(id, updates);
    if (!updated) return undefined;

    if (updated.name !== current.name || updated.color !== current.color) {
      taskRepository
        .getAll()
        .filter((task) => task.workspace === current.name)
        .forEach((task) =>
          taskRepository.update(task.id, {
            workspace: updated.name,
            categoryColor: updated.color,
          }),
        );
      if (updated.name !== current.name) {
        calendarRepository.renameWorkspaceReferences(current.name, updated.name);
        void noteFolderRepository
          .getAll()
          .then((folders) =>
            Promise.all(
            folders
              .filter((folder) => folder.name.trim().toLowerCase() === current.name.toLowerCase())
              .map((folder) => noteFolderRepository.rename(folder.id, updated.name)),
            ),
          )
          .catch((error) => {
            console.error('[clockit/workspaces] Unable to rename linked notebook folders.', error);
          });
      }
    }
    return updated;
  }

  /** Removes the workspace entry. Its tasks keep their `workspace` name and
   *  are not deleted, so no user data is silently destroyed. */
  deleteWorkspace(id: string): void {
    workspaceRepository.remove(id);
    if (preferencesRepository.get('activeWorkspaceId') === id) {
      preferencesRepository.set('activeWorkspaceId', null);
    }
  }

  // Tasks Management
  getTasks(): TaskItem[] {
    return taskRepository.getAll();
  }

  getTaskById(id: string): TaskItem | undefined {
    return taskRepository.getById(id);
  }

  addTask(data: Partial<TaskItem>): TaskItem {
    return taskRepository.create(data);
  }

  /**
   * Returns `undefined` when no task carries that id.
   * The previous implementation threw, and no caller caught it (Phase 11 §5).
   */
  updateTask(id: string, updates: Partial<TaskItem>): TaskItem | undefined {
    return taskRepository.update(id, updates);
  }

  toggleTask(id: string): TaskItem[] {
    taskRepository.toggle(id);
    return taskRepository.getAll();
  }

  deleteTask(id: string): void {
    taskRepository.remove(id);
    if (focusRepository.getSelectedTaskId() === id) {
      focusRepository.setSelectedTaskId(null);
    }
  }

  // Today Tasks (Unified with main task store)
  getTodayTasks(): TaskItem[] {
    return taskRepository.getToday();
  }

  toggleTodayTask(id: string): TaskItem[] {
    taskRepository.toggle(id);
    return taskRepository.getToday();
  }

  addTodayTask(title: string): TaskItem[] {
    taskRepository.create({
      title,
      isToday: true,
      deadline: 'Today',
      daysLeft: 'Today',
      dueDate: ANCHOR_DATE,
      priority: 'Medium',
      workspace: 'Personal',
    });
    return taskRepository.getToday();
  }

  // Focus Integration
  getSelectedFocusTaskId(): string | null {
    const id = focusRepository.getSelectedTaskId();
    if (id && !taskRepository.getById(id)) {
      // The referenced task is gone — drop the stale pointer without notifying
      // (this runs during render).
      focusRepository.setSelectedTaskId(null, true);
      return null;
    }
    return id;
  }

  setSelectedFocusTaskId(id: string | null): void {
    focusRepository.setSelectedTaskId(id);
  }

  recordFocusSession(session: FocusSessionRecordInput): FocusSession {
    const task = session.taskId ? taskRepository.getById(session.taskId) : undefined;

    const newSession = focusRepository.record({
      taskId: session.taskId || null,
      taskTitle: session.taskTitle || task?.title || 'General Session',
      mode: session.mode,
      durationMinutes: session.durationMinutes,
    });

    if (session.taskId && task) {
      taskRepository.update(session.taskId, {
        focusMinutes: (task.focusMinutes || 0) + session.durationMinutes,
        focusSessionsCount: (task.focusSessionsCount || 0) + 1,
      });
    }

    return newSession;
  }

  getFocusSessions(): FocusSession[] {
    return focusRepository.getAll();
  }

  // Habits
  getHabits(): HabitItem[] {
    return habitRepository.getAll();
  }

  toggleHabit(id: string): HabitItem[] {
    return habitRepository.toggle(id);
  }

  getHabitCalendarDays(): HabitDayState[] {
    return habitRepository.getCalendarDays();
  }

  // Calendar
  getCalendarEvents(): CalendarEvent[] {
    return calendarRepository.getEvents();
  }

  addCalendarEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
    return calendarRepository.addEvent(event);
  }

  getTimelineEvents(): TimelineEvent[] {
    return calendarRepository.getTimelineEvents();
  }

  // Knowledge Graph — static reference data, never persisted.
  getGraphNodes(): GraphNode[] {
    return KNOWLEDGE_GRAPH_NODES;
  }

  getGraphLinks(): GraphLink[] {
    return KNOWLEDGE_GRAPH_LINKS;
  }

  // Focus Stats — derived entirely from the recorded sessions, never seeded constants.
  getFocusStats() {
    return selectFocusStats(focusRepository.getAll());
  }

  // Quick Notes
  getQuickNotes(): string[] {
    return noteRepository.getQuickNotes();
  }

  addQuickNote(note: string): string[] {
    const updated = noteRepository.addQuickNote(note);
    this.notify();
    return updated;
  }

  updateQuickNote(index: number, content: string): string[] {
    const updated = noteRepository.updateQuickNote(index, content);
    this.notify();
    return updated;
  }

  deleteQuickNote(index: number): string[] {
    const updated = noteRepository.deleteQuickNote(index);
    this.notify();
    return updated;
  }

  setQuickNotes(notes: string[]): string[] {
    const updated = noteRepository.setQuickNotes(notes);
    this.notify();
    return updated;
  }
}

export const dataService = new DataService();
