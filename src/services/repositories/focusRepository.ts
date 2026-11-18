import { type FocusSession } from '../../data/mockData';
import { LocalJsonStore, ObservableRepository, scopedStorageKey } from './storage';
import type { FocusSessionInput, FocusSessionRepository } from './types';

const isSessionArray = (value: unknown): value is FocusSession[] => Array.isArray(value);

/**
 * Local-storage backed focus repository.
 *
 * It owns both the session log (`clockit_focus_sessions`) and the id of the
 * task the timer is pointed at (`clockit_selected_focus_task_id`), because the
 * two are always written together.
 */
export class LocalFocusSessionRepository
  extends ObservableRepository
  implements FocusSessionRepository
{
  get keys(): readonly string[] { return ['clockit_focus_sessions', 'clockit_selected_focus_task_id'].map((key) => scopedStorageKey(key)); }

  private readonly store = new LocalJsonStore<FocusSession[]>(
    'clockit_focus_sessions',
    [],
    isSessionArray,
  );

  private readonly selection = new LocalJsonStore<string | null>(
    'clockit_selected_focus_task_id',
    null,
  );

  getAll(): FocusSession[] {
    return [...this.store.value];
  }

  record(input: FocusSessionInput): FocusSession {
    const session: FocusSession = {
      id: `fs-${Date.now()}`,
      taskId: input.taskId || null,
      taskTitle: input.taskTitle || 'General Session',
      mode: input.mode,
      durationMinutes: input.durationMinutes,
      completedAt: Date.now(),
    };

    this.store.save([session, ...this.store.value]);
    this.emit();
    return session;
  }

  getSelectedTaskId(): string | null {
    const id = this.selection.value;
    return typeof id === 'string' && id.length > 0 ? id : null;
  }

  setSelectedTaskId(id: string | null, silent = false): void {
    this.selection.save(id);
    if (!silent) this.emit();
  }

  refreshFromStorage(): boolean {
    this.store.refresh();
    this.selection.refresh();
    this.emit();
    return true;
  }
}
