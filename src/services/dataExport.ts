import {
  workspaceRepository,
  taskRepository,
  calendarRepository,
  focusRepository,
  habitRepository,
  noteRepository,
  noteFolderRepository,
  preferencesRepository,
} from './repositories';

export interface ClockItExportData {
  version: string;
  exportedAt: string;
  user: {
    id: string;
    email?: string;
    name?: string;
  };
  clockit: {
    workspaces: unknown[];
    tasks: unknown[];
    calendarEvents: unknown[];
    timelineEvents: unknown[];
    focusSessions: unknown[];
    habits: unknown[];
    notes: unknown[];
    noteFolders: unknown[];
    quickNotes: string[];
    preferences: unknown;
  };
}

/**
 * Compiles a comprehensive, user-owned data export containing only
 * the authenticated user's ClockIt data across all modules.
 */
export async function compileUserDataExport(user: { id: string; email?: string; name?: string }): Promise<ClockItExportData> {
  const [notes, noteFolders] = await Promise.all([
    noteRepository.getAll(),
    noteFolderRepository.getAll(),
  ]);

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    clockit: {
      workspaces: workspaceRepository.getAll(),
      tasks: taskRepository.getAll(),
      calendarEvents: calendarRepository.getEvents(),
      timelineEvents: calendarRepository.getTimelineEvents(),
      focusSessions: focusRepository.getAll(),
      habits: habitRepository.getAll(),
      notes,
      noteFolders,
      quickNotes: noteRepository.getQuickNotes(),
      preferences: preferencesRepository.getAll(),
    },
  };
}

/**
 * Triggers a browser file download of the compiled JSON export.
 */
export async function downloadUserDataExport(user: { id: string; email?: string; name?: string }): Promise<void> {
  const data = await compileUserDataExport(user);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);

  const a = document.createElement('a');
  a.href = url;
  a.download = `clockit-export-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
