/**
 * Demo Service (Phase 12.4).
 *
 * Manages the isolated, read-only demo experience:
 *  - Seeds realistic sample data into local repositories
 *  - Guarantees zero network calls to Supabase
 *  - Enforces read-only notifications for mutating actions
 *  - Cleans up state when exiting demo mode
 */
import { localStore, scopedStorageKey } from '../services/repositories/storage';
import {
  calendarRepository,
  focusRepository,
  habitRepository,
  noteRepository,
  preferencesRepository,
  taskRepository,
  workspaceRepository,
} from '../services/repositories';
import {
  DEMO_CALENDAR_EVENTS,
  DEMO_FOCUS_SESSIONS,
  DEMO_HABITS,
  DEMO_QUICK_NOTES,
  DEMO_TASKS,
  DEMO_TIMELINE_EVENTS,
  DEMO_WORKSPACES,
} from './demoData';

let toastTimeout: number | null = null;

export function isDemoActive(): boolean {
  try {
    const raw = localStorage.getItem('clockit-auth-session');
    if (!raw) return false;
    const session = JSON.parse(raw);
    return Boolean(session?.isDemo);
  } catch {
    return false;
  }
}

/**
 * Loads rich sample data for all 11 modules into local storage.
 * Completely bypassed by real authenticated users.
 */
export function loadDemoData(): void {
  localStore.writeJson(scopedStorageKey('clockit_workspaces'), DEMO_WORKSPACES);
  localStore.writeJson(scopedStorageKey('clockit_tasks'), DEMO_TASKS);
  localStore.writeJson(scopedStorageKey('clockit_focus_sessions'), DEMO_FOCUS_SESSIONS);
  localStore.writeJson(scopedStorageKey('clockit_habits'), DEMO_HABITS);
  localStore.writeJson(scopedStorageKey('clockit_calendar_events'), DEMO_CALENDAR_EVENTS);
  localStore.writeJson(scopedStorageKey('clockit_timeline_events'), DEMO_TIMELINE_EVENTS);
  localStore.writeJson(scopedStorageKey('clockit_quick_notes'), DEMO_QUICK_NOTES);

  // Trigger repositories to re-read
  workspaceRepository.refreshFromStorage();
  taskRepository.refreshFromStorage();
  focusRepository.refreshFromStorage();
  habitRepository.refreshFromStorage();
  calendarRepository.refreshFromStorage();
  noteRepository.refreshFromStorage();

  // Set active workspace to Personal
  preferencesRepository.set('activeWorkspaceId', 'personal');
}

/**
 * Clears demo data from local storage and resets repositories to clean state.
 */
export function clearDemoData(): void {
  localStore.writeJson(scopedStorageKey('clockit_workspaces'), [
    {
      id: 'personal',
      name: 'Personal',
      color: '#22c55e',
      description: 'Default personal workspace',
      icon: 'Home',
      cover: 'personal',
    },
  ]);
  localStore.writeJson(scopedStorageKey('clockit_tasks'), []);
  localStore.writeJson(scopedStorageKey('clockit_focus_sessions'), []);
  localStore.writeJson(scopedStorageKey('clockit_habits'), []);
  localStore.writeJson(scopedStorageKey('clockit_calendar_events'), []);
  localStore.writeJson(scopedStorageKey('clockit_timeline_events'), []);
  localStore.writeJson(scopedStorageKey('clockit_quick_notes'), []);

  workspaceRepository.refreshFromStorage();
  taskRepository.refreshFromStorage();
  focusRepository.refreshFromStorage();
  habitRepository.refreshFromStorage();
  calendarRepository.refreshFromStorage();
  noteRepository.refreshFromStorage();
}

/**
 * Shows a toast notice informing the visitor that demo mode is read-only / temporary.
 */
export function notifyDemoMutation(): void {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById('clockit-demo-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'clockit-demo-toast';
  toast.className = 'clockit-demo-toast';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span class="clockit-demo-toast-dot"></span>
    <span><strong>Demo Mode:</strong> Changes are temporary and will not persist.</span>
  `;

  document.body.appendChild(toast);

  if (toastTimeout !== null) clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
