/**
 * Repository interfaces (Phase 11 §1).
 *
 * Every domain the UI reads or writes is expressed here as an interface, so
 * the components depend on the contract rather than on `localStorage`,
 * IndexedDB or the service facade. The local implementations live next to this
 * file; a Supabase-backed set can replace them later without touching the UI.
 */
import type { OwnedEntity } from '../../data/ownership';
import type {
  CalendarEvent,
  FocusSession,
  HabitDayState,
  HabitItem,
  TaskItem,
  TimelineEvent,
  Workspace,
} from '../../data/mockData';
import type { GraphLink, GraphNode, NoteFolder, NoteItem } from '../notesStorage';

/** What every repository offers: the storage keys it owns and a change channel. */
export interface Repository {
  /** Local-storage keys (or broadcast scopes) this repository is responsible for. */
  readonly keys: readonly string[];
  /** Notifies this tab when the repository's data changed, locally or cross-tab. */
  subscribe(listener: () => void): () => void;
  /** Re-reads from storage after another tab wrote. Never writes back. */
  refreshFromStorage(): boolean;
}

// ---------------------------------------------------------------- Tasks

export interface TaskRepository extends Repository {
  getAll(): TaskItem[];
  getById(id: string): TaskItem | undefined;
  create(data: Partial<TaskItem>): TaskItem;
  /** Returns `undefined` when no task carries that id — never throws (Phase 11 §5). */
  update(id: string, updates: Partial<TaskItem>): TaskItem | undefined;
  toggle(id: string): TaskItem | undefined;
  remove(id: string): void;
  /** The anchor day's tasks, using the shared "today" definition. */
  getToday(): TaskItem[];
}

// ----------------------------------------------------------- Workspaces

export interface WorkspaceRepository extends Repository {
  getAll(): Workspace[];
  getById(id: string): Workspace | undefined;
  create(data: Partial<Workspace> & { name: string }): Workspace;
  update(id: string, updates: Partial<Workspace>): Workspace | undefined;
  /** Removes the workspace. Its tasks are NOT deleted — they keep their
   *  `workspace` name so the data survives (Task 4D requirement). */
  remove(id: string): void;
}

// -------------------------------------------------------- Focus sessions

export interface FocusSessionInput {
  taskId?: string | null;
  taskTitle?: string;
  mode: FocusSession['mode'];
  durationMinutes: number;
}

export interface FocusSessionRepository extends Repository {
  getAll(): FocusSession[];
  record(input: FocusSessionInput): FocusSession;
  /** Id of the task the focus timer is currently pointed at, if it still exists. */
  getSelectedTaskId(): string | null;
  /** Persisted via `silent` when the caller must not re-render (e.g. during a read). */
  setSelectedTaskId(id: string | null, silent?: boolean): void;
}

// --------------------------------------------------------------- Habits

export interface HabitRepository extends Repository {
  getAll(): HabitItem[];
  toggle(id: string): HabitItem[];
  /** Month grid for the habit calendar. Static reference data, not persisted. */
  getCalendarDays(): HabitDayState[];
}

// ------------------------------------------------------ Calendar events

export interface CalendarRepository extends Repository {
  getEvents(): CalendarEvent[];
  addEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent;
  renameWorkspaceReferences(previousName: string, nextName: string): void;
  getTimelineEvents(): TimelineEvent[];
}

// ---------------------------------------------------------------- Notes

export interface NoteRepository extends Repository {
  /** Seeds the default notebook on a brand-new database. Safe to call repeatedly. */
  init(): Promise<void>;
  getAll(): Promise<NoteItem[]>;
  getTrash(): Promise<NoteItem[]>;
  getById(id: string): Promise<NoteItem | undefined>;
  create(folderId?: string, title?: string): Promise<NoteItem>;
  /** Rejects when the note does not exist. */
  update(id: string, updates: Partial<NoteItem>): Promise<NoteItem>;
  toggleFavorite(id: string): Promise<boolean>;
  moveToTrash(id: string): Promise<void>;
  restoreFromTrash(id: string): Promise<void>;
  deletePermanently(id: string): Promise<void>;
  extractInternalLinks(content: string): string[];
  buildKnowledgeGraph(
    notes: NoteItem[],
    folders: NoteFolder[],
  ): { nodes: GraphNode[]; links: GraphLink[] };
  getBacklinks(notes: NoteItem[], targetTitle: string): NoteItem[];
  /** Lightweight capture list, stored alongside the notebook. */
  getQuickNotes(): string[];
  addQuickNote(note: string): string[];
  updateQuickNote(index: number, content: string): string[];
  deleteQuickNote(index: number): string[];
  setQuickNotes(notes: string[]): string[];
}

// --------------------------------------------------------- Note folders

export interface NoteFolderRepository extends Repository {
  getAll(): Promise<NoteFolder[]>;
  create(name: string, color?: string, parentId?: string | null): Promise<NoteFolder>;
  rename(id: string, newName: string): Promise<void>;
  remove(id: string): Promise<void>;
}

// ----------------------------------------------------- User preferences

export type AppearanceMode = 'light' | 'dark' | 'system';

export interface UserPreferences extends OwnedEntity {
  theme: 'light' | 'dark';
  appearancePreference: AppearanceMode;
  sidebarCollapsed: boolean;
  notificationReadKeys: string[];
  activeWorkspaceId: string | null;
  onboardingCompleted: boolean;
  productivityChallenges: string[];
  planningPreference: string | null;
  preferredFocusDuration: number;
}

export type PreferenceKey =
  | 'theme'
  | 'appearancePreference'
  | 'sidebarCollapsed'
  | 'notificationReadKeys'
  | 'activeWorkspaceId'
  | 'onboardingCompleted'
  | 'productivityChallenges'
  | 'planningPreference'
  | 'preferredFocusDuration';

export interface PreferencesRepository extends Repository {
  get<K extends PreferenceKey>(key: K): UserPreferences[K];
  getAll(): UserPreferences;
  set<K extends PreferenceKey>(key: K, value: UserPreferences[K]): void;
}
