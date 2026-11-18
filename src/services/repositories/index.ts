/**
 * Repository container.
 *
 * Constructs the local repositories once and wires cross-tab synchronisation
 * (Phase 11 §3): when another tab writes, the matching repositories re-read
 * from storage and notify their listeners. Nothing writes back while handling
 * an external change, which is what prevents echo loops and duplicate writes.
 */
import { crossTab } from './crossTab';
import { setStorageOwner as setOwner, getStorageOwner } from './storage';
import { LocalTaskRepository } from './taskRepository';
import { LocalWorkspaceRepository } from './workspaceRepository';
import { LocalFocusSessionRepository } from './focusRepository';
import { LocalHabitRepository } from './habitRepository';
import { LocalCalendarRepository } from './calendarRepository';
import { LocalNoteRepository, LocalNoteFolderRepository } from './notesRepository';
import { LocalPreferencesRepository } from './preferencesRepository';
import type { Repository } from './types';

export const taskRepository = new LocalTaskRepository();
export const workspaceRepository = new LocalWorkspaceRepository();
export const focusRepository = new LocalFocusSessionRepository();
export const habitRepository = new LocalHabitRepository();
export const calendarRepository = new LocalCalendarRepository();
export const noteRepository = new LocalNoteRepository();
export const noteFolderRepository = new LocalNoteFolderRepository();
export const preferencesRepository = new LocalPreferencesRepository();

/** Every repository, in the order the UI domains are declared. */
export const repositories: readonly Repository[] = [
  taskRepository,
  workspaceRepository,
  focusRepository,
  habitRepository,
  calendarRepository,
  noteRepository,
  noteFolderRepository,
  preferencesRepository,
];

/** Switches every repository's working view without clearing any owner's cache. */
export function setRepositoryOwner(ownerId: string | null): void {
  const nextOwner = ownerId || 'local';
  if (getStorageOwner() === nextOwner) return;
  setOwner(nextOwner);
  repositories.forEach((repository) => repository.refreshFromStorage());
}

crossTab.onChange((changedKeys) => {
  repositories.forEach((repository) => {
    if (crossTab.matches(changedKeys, repository.keys)) {
      repository.refreshFromStorage();
    }
  });
});

export { crossTab } from './crossTab';
export { storageIssues } from './storage';
export type { StorageIssue, StorageIssueKind } from './storage';
export * from './types';
