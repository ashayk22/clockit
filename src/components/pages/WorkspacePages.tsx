import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  CalendarDays,
  Check,
  CheckSquare,
  Clock3,
  Code2,
  GraduationCap,
  Home,
  LayoutGrid,
  List,
  NotebookPen,
  Pencil,
  Plus,
  Target,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { Workspace, TaskItem } from '../../data/mockData';
import { ANCHOR_DATE, dataService } from '../../services/dataService';
import {
  noteFolderRepository,
  noteRepository,
  preferencesRepository,
} from '../../services/repositories';
import type { NoteFolder, NoteItem } from '../../services/notesStorage';
import { FocusPage } from './FocusPage';
import { NotesEditor } from '../notes/NotesEditor';
import { WorkspaceCover } from '../brand/WorkspaceCovers';
import '../../styles/workspaces.css';

const COVER_OPTIONS = ['generic', 'personal', 'college', 'club', 'freelance', 'development'];
const WORKSPACE_COLORS = ['#155e45', '#4b76bd', '#8a63b5', '#bf7b36', '#278c71', '#687584'];
const TABS = ['overview', 'tasks', 'focus', 'notes', 'calendar', 'analytics'] as const;
type WorkspaceTab = (typeof TABS)[number];

const TAB_LABELS: Record<WorkspaceTab, string> = {
  overview: 'Overview',
  tasks: 'Tasks',
  focus: 'Focus',
  notes: 'Notes',
  calendar: 'Calendar',
  analytics: 'Analytics',
};

const TAB_ICONS: Record<WorkspaceTab, React.ReactNode> = {
  overview: <Home size={17} />,
  tasks: <CheckSquare size={17} />,
  focus: <Target size={17} />,
  notes: <NotebookPen size={17} />,
  calendar: <CalendarDays size={17} />,
  analytics: <BarChart3 size={17} />,
};

const iconForWorkspace = (workspace: Workspace): React.ReactNode => {
  const iconProps = { size: 19, strokeWidth: 1.8 };
  switch (workspace.icon) {
    case 'GraduationCap':
      return <GraduationCap {...iconProps} />;
    case 'Users':
      return <Users {...iconProps} />;
    case 'Briefcase':
      return <Briefcase {...iconProps} />;
    case 'Code2':
      return <Code2 {...iconProps} />;
    default:
      return <Home {...iconProps} />;
  }
};

function useWorkspaceData() {
  const [workspaces, setWorkspaces] = useState(() => dataService.getWorkspaces());
  const [tasks, setTasks] = useState(() => dataService.getTasks());
  const [sessions, setSessions] = useState(() => dataService.getFocusSessions());

  useEffect(
    () =>
      dataService.subscribe(() => {
        setWorkspaces(dataService.getWorkspaces());
        setTasks(dataService.getTasks());
        setSessions(dataService.getFocusSessions());
      }),
    [],
  );

  return { workspaces, tasks, sessions };
}

function workspaceStats(workspace: Workspace, tasks: TaskItem[]) {
  const scoped = tasks.filter((task) => task.workspace === workspace.name);
  const completed = scoped.filter((task) => task.completed || task.status === 'completed').length;
  const focusMinutes = scoped.reduce((total, task) => total + (task.focusMinutes || 0), 0);
  return {
    tasks: scoped,
    total: scoped.length,
    completed,
    inProgress: scoped.filter((task) => task.status === 'in-progress' && !task.completed).length,
    focusMinutes,
    progress: scoped.length ? Math.round((completed / scoped.length) * 100) : 0,
  };
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}m`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

interface WorkspaceFormValues {
  name: string;
  description: string;
  color: string;
  cover: string;
}

const emptyWorkspaceForm: WorkspaceFormValues = {
  name: '',
  description: '',
  color: WORKSPACE_COLORS[0],
  cover: 'generic',
};

interface WorkspaceFormDialogProps {
  workspace?: Workspace;
  onClose: () => void;
  onSave: (values: WorkspaceFormValues) => void;
  onDelete?: () => void;
}

const WorkspaceFormDialog: React.FC<WorkspaceFormDialogProps> = ({
  workspace,
  onClose,
  onSave,
  onDelete,
}) => {
  const [values, setValues] = useState<WorkspaceFormValues>(() =>
    workspace
      ? {
          name: workspace.name,
          description: workspace.description || '',
          color: workspace.color,
          cover: workspace.cover || 'generic',
        }
      : emptyWorkspaceForm,
  );
  const [error, setError] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const update = (key: keyof WorkspaceFormValues, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <div
      className="workspace-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="workspace-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-dialog-title"
      >
        <header className="workspace-dialog-head">
          <div>
            <p className="workspace-kicker">{workspace ? 'Workspace settings' : 'New space'}</p>
            <h2 id="workspace-dialog-title">{workspace ? 'Edit workspace' : 'Create workspace'}</h2>
          </div>
          <button className="workspace-icon-button" type="button" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </header>
        <form
          className="workspace-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!values.name.trim()) {
              setError('Enter a workspace name.');
              return;
            }
            try {
              onSave(values);
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : 'Workspace could not be saved.');
            }
          }}
        >
          <label>
            Workspace name
            <input
              autoFocus
              maxLength={48}
              value={values.name}
              onChange={(event) => {
                update('name', event.target.value);
                setError('');
              }}
              placeholder="For example, Research"
              required
            />
          </label>
          <label>
            Description
            <textarea
              rows={3}
              maxLength={180}
              value={values.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder="What belongs in this workspace?"
            />
          </label>
          <fieldset className="workspace-color-field">
            <legend>Accent color</legend>
            <div className="workspace-color-options">
              {WORKSPACE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`workspace-color-swatch${values.color === color ? ' is-selected' : ''}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Choose ${color} accent`}
                  aria-pressed={values.color === color}
                  onClick={() => update('color', color)}
                >
                  {values.color === color ? <Check size={14} /> : null}
                </button>
              ))}
              <label className="workspace-custom-color">
                <span>Custom</span>
                <input
                  type="color"
                  value={values.color}
                  onChange={(event) => update('color', event.target.value)}
                  aria-label="Choose custom workspace color"
                />
              </label>
            </div>
          </fieldset>
          <label>
            Cover illustration
            <select value={values.cover} onChange={(event) => update('cover', event.target.value)}>
              {COVER_OPTIONS.map((cover) => (
                <option key={cover} value={cover}>
                  {cover.charAt(0).toUpperCase() + cover.slice(1)}
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="workspace-form-error" role="alert">{error}</p> : null}
          <footer className="workspace-dialog-actions">
            {workspace && onDelete ? (
              <button className="workspace-danger-button" type="button" onClick={onDelete}>
                <Trash2 size={15} />
                Delete
              </button>
            ) : null}
            <span className="workspace-dialog-spacer" />
            <button className="workspace-secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="workspace-primary-button" type="submit">
              {workspace ? 'Save changes' : 'Create workspace'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

export const WorkspaceOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { workspaces, tasks } = useWorkspaceData();
  const [formWorkspace, setFormWorkspace] = useState<Workspace | null | undefined>(undefined);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const showCreateDialog = () => setFormWorkspace(null);
  const openWorkspace = (workspace: Workspace) => {
    preferencesRepository.set('activeWorkspaceId', workspace.id);
    navigate(`/app/workspaces/${workspace.id}/overview`);
  };

  const saveWorkspace = (values: WorkspaceFormValues) => {
    if (formWorkspace) {
      dataService.updateWorkspace(formWorkspace.id, values);
    } else {
      const created = dataService.addWorkspace(values);
      preferencesRepository.set('activeWorkspaceId', created.id);
    }
    setFormWorkspace(undefined);
  };

  const deleteWorkspace = (workspace: Workspace) => {
    const hasTasks = tasks.some((task) => task.workspace === workspace.name);
    const detail = hasTasks
      ? ' Existing tasks and notes are kept; only the workspace entry is removed.'
      : '';
    if (!window.confirm(`Delete "${workspace.name}"?${detail}`)) return;
    dataService.deleteWorkspace(workspace.id);
    setFormWorkspace(undefined);
  };

  return (
    <div className="clockit-page-container workspace-page">
      <header className="workspace-overview-head">
        <div>
          <p className="workspace-kicker">Make room for what matters</p>
          <h1 className="workspace-page-title">Workspaces</h1>
          <p className="workspace-page-subtitle">Organize your projects, routines, and focus areas.</p>
        </div>
        <div className="workspace-overview-actions">
          <div className="workspace-view-switch" role="group" aria-label="Workspace layout">
            <button
              type="button"
              aria-label="Grid layout"
              aria-pressed={layout === 'grid'}
              className={layout === 'grid' ? 'is-active' : ''}
              onClick={() => setLayout('grid')}
            >
              <LayoutGrid size={17} />
            </button>
            <button
              type="button"
              aria-label="List layout"
              aria-pressed={layout === 'list'}
              className={layout === 'list' ? 'is-active' : ''}
              onClick={() => setLayout('list')}
            >
              <List size={17} />
            </button>
          </div>
          <button className="workspace-primary-button" type="button" onClick={showCreateDialog}>
            <Plus size={17} />
            New workspace
          </button>
        </div>
      </header>

      <section className={`workspace-grid${layout === 'list' ? ' is-list' : ''}`} aria-label="Your workspaces">
        {workspaces.map((workspace) => {
          const stats = workspaceStats(workspace, tasks);
          return (
            <article key={workspace.id} className="workspace-card">
              <button
                type="button"
                className="workspace-card-cover"
                onClick={() => openWorkspace(workspace)}
                aria-label={`Open ${workspace.name} workspace`}
              >
                <WorkspaceCover cover={workspace.cover} className="workspace-cover-illustration" />
                <span className="workspace-card-cover-mark" style={{ color: workspace.color }}>
                  {iconForWorkspace(workspace)}
                </span>
              </button>
              <div className="workspace-card-content">
                <div className="workspace-card-title-row">
                  <button type="button" className="workspace-card-title" onClick={() => openWorkspace(workspace)}>
                    {workspace.name}
                  </button>
                  <button
                    type="button"
                    className="workspace-icon-button"
                    aria-label={`Edit ${workspace.name}`}
                    title={`Edit ${workspace.name}`}
                    onClick={() => setFormWorkspace(workspace)}
                  >
                    <Pencil size={15} />
                  </button>
                </div>
                <p className="workspace-card-description">{workspace.description || 'A space for your work and ideas.'}</p>
                <div className="workspace-card-stats">
                  <span><CheckSquare size={15} />{stats.total} tasks</span>
                  <span><Clock3 size={15} />{formatMinutes(stats.focusMinutes)}</span>
                  <span>{stats.progress}% complete</span>
                </div>
                <div
                  className="workspace-progress-track"
                  role="progressbar"
                  aria-label={`${workspace.name} task completion`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={stats.progress}
                >
                  <span style={{ width: `${stats.progress}%`, backgroundColor: workspace.color }} />
                </div>
                <button className="workspace-card-open" type="button" onClick={() => openWorkspace(workspace)}>
                  Open workspace <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          );
        })}
        <button className="workspace-create-card" type="button" onClick={showCreateDialog}>
          <span className="workspace-create-icon"><Plus size={24} /></span>
          <strong>Add a workspace</strong>
          <span>Give a project its own home.</span>
        </button>
      </section>

      {formWorkspace !== undefined ? (
        <WorkspaceFormDialog
          workspace={formWorkspace || undefined}
          onClose={() => setFormWorkspace(undefined)}
          onSave={saveWorkspace}
          onDelete={formWorkspace ? () => deleteWorkspace(formWorkspace) : undefined}
        />
      ) : null}
    </div>
  );
};

export const WorkspaceDashboardPage: React.FC = () => {
  const { workspaceId = '', tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const { workspaces, tasks } = useWorkspaceData();
  const [formOpen, setFormOpen] = useState(false);
  const workspace = workspaces.find((item) => item.id === workspaceId);
  const activeTab: WorkspaceTab = TABS.includes(tab as WorkspaceTab) ? (tab as WorkspaceTab) : 'overview';
  const scopedTasks = useMemo(
    () => (workspace ? tasks.filter((task) => task.workspace === workspace.name) : []),
    [tasks, workspace],
  );

  useEffect(() => {
    if (!workspaces.length) return;
    if (!workspace) {
      navigate('/app/workspaces', { replace: true });
      return;
    }
    if (preferencesRepository.get('activeWorkspaceId') !== workspace.id) {
      preferencesRepository.set('activeWorkspaceId', workspace.id);
    }
  }, [navigate, workspace, workspaces.length]);

  if (!workspace) return null;

  const navigateTab = (nextTab: WorkspaceTab) =>
    navigate(`/app/workspaces/${workspace.id}/${nextTab}`);

  const saveWorkspace = (values: WorkspaceFormValues) => {
    dataService.updateWorkspace(workspace.id, values);
    setFormOpen(false);
  };

  const deleteWorkspace = () => {
    const detail = scopedTasks.length
      ? ' Existing tasks and notes are kept; only the workspace entry is removed.'
      : '';
    if (!window.confirm(`Delete "${workspace.name}"?${detail}`)) return;
    dataService.deleteWorkspace(workspace.id);
    navigate('/app/workspaces', { replace: true });
  };

  return (
    <div className="clockit-page-container workspace-page workspace-detail-page">
      <section className="workspace-detail-hero">
        <WorkspaceCover cover={workspace.cover} className="workspace-cover-illustration" />
        <div className="workspace-detail-shade" />
        <button
          className="workspace-back-button"
          type="button"
          onClick={() => navigate('/app/workspaces')}
          aria-label="Back to workspaces"
        >
          <ArrowLeft size={17} />
        </button>
        <div className="workspace-detail-identity">
          <span className="workspace-detail-icon" style={{ color: workspace.color }}>
            {iconForWorkspace(workspace)}
          </span>
          <div>
            <p className="workspace-kicker">Workspace</p>
            <h1>{workspace.name}</h1>
            <p>{workspace.description || 'A space for your work and ideas.'}</p>
          </div>
        </div>
        <button className="workspace-settings-button" type="button" onClick={() => setFormOpen(true)}>
          <Pencil size={15} />
          Workspace settings
        </button>
      </section>

      <nav className="workspace-tabs" aria-label={`${workspace.name} workspace tabs`} role="tablist">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={activeTab === item}
            className={activeTab === item ? 'is-active' : ''}
            onClick={() => navigateTab(item)}
          >
            {TAB_ICONS[item]}
            <span>{TAB_LABELS[item]}</span>
          </button>
        ))}
      </nav>

      <section className="workspace-tab-panel" role="tabpanel" key={`${workspace.id}-${activeTab}`}>
        {activeTab === 'overview' ? <WorkspaceOverviewTab workspace={workspace} tasks={scopedTasks} /> : null}
        {activeTab === 'tasks' ? <WorkspaceTasksTab workspace={workspace} tasks={scopedTasks} /> : null}
        {activeTab === 'focus' ? <FocusPage workspaceName={workspace.name} /> : null}
        {activeTab === 'notes' ? <WorkspaceNotesTab workspace={workspace} /> : null}
        {activeTab === 'calendar' ? <WorkspaceCalendarTab workspace={workspace} tasks={scopedTasks} /> : null}
        {activeTab === 'analytics' ? <WorkspaceAnalyticsTab workspace={workspace} tasks={scopedTasks} /> : null}
      </section>

      {formOpen ? (
        <WorkspaceFormDialog
          workspace={workspace}
          onClose={() => setFormOpen(false)}
          onSave={saveWorkspace}
          onDelete={deleteWorkspace}
        />
      ) : null}
    </div>
  );
};

const WorkspaceOverviewTab: React.FC<{ workspace: Workspace; tasks: TaskItem[] }> = ({ workspace, tasks }) => {
  const navigate = useNavigate();
  const stats = workspaceStats(workspace, tasks);
  const nextTasks = tasks
    .filter((task) => !task.completed && task.status !== 'completed')
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
    .slice(0, 5);

  return (
    <div className="workspace-overview-content">
      <div className="workspace-metric-grid">
        <MetricCard label="Total tasks" value={stats.total} icon={<CheckSquare size={18} />} />
        <MetricCard label="In progress" value={stats.inProgress} icon={<Clock3 size={18} />} />
        <MetricCard label="Completed" value={stats.completed} icon={<Check size={18} />} />
        <MetricCard label="Focus time" value={formatMinutes(stats.focusMinutes)} icon={<Target size={18} />} />
      </div>
      <section className="workspace-content-card">
        <header className="workspace-section-head">
          <div>
            <p className="workspace-kicker">A clear next step</p>
            <h2>Tasks in {workspace.name}</h2>
          </div>
          <button className="workspace-secondary-button" type="button" onClick={() => navigate('../tasks')}>
            View tasks <span aria-hidden="true">→</span>
          </button>
        </header>
        {nextTasks.length ? (
          <TaskList tasks={nextTasks} workspace={workspace} />
        ) : (
          <EmptyState title="A clean slate" detail="Add a task when you’re ready to get started." />
        )}
      </section>
    </div>
  );
};

const WorkspaceTasksTab: React.FC<{ workspace: Workspace; tasks: TaskItem[] }> = ({ workspace, tasks }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskItem['priority']>('Medium');
  const [query, setQuery] = useState('');
  const visibleTasks = tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase().trim()));

  const addTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    dataService.addTask({
      title: title.trim(),
      workspace: workspace.name,
      categoryColor: workspace.color,
      priority,
      dueDate: dueDate || undefined,
    });
    setTitle('');
    setDueDate('');
  };

  return (
    <div className="workspace-content-card">
      <header className="workspace-section-head">
        <div>
          <p className="workspace-kicker">{tasks.length} saved {tasks.length === 1 ? 'task' : 'tasks'}</p>
          <h2>Tasks</h2>
        </div>
        <label className="workspace-search">
          <span className="sr-only">Search workspace tasks</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a task" />
        </label>
      </header>
      <form className="workspace-task-create" onSubmit={addTask}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-label={`Add a task to ${workspace.name}`}
          placeholder={`Add a task to ${workspace.name}`}
          maxLength={120}
          required
        />
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          aria-label="Task due date"
        />
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as TaskItem['priority'])}
          aria-label="Task priority"
        >
          {(['Critical', 'High', 'Medium', 'Low'] as const).map((item) => <option key={item}>{item}</option>)}
        </select>
        <button className="workspace-primary-button" type="submit"><Plus size={16} />Add task</button>
      </form>
      {visibleTasks.length ? <TaskList tasks={visibleTasks} workspace={workspace} showWorkspace /> : (
        <EmptyState title="No matching tasks" detail="Try another search or add a task above." />
      )}
    </div>
  );
};

const TaskList: React.FC<{ tasks: TaskItem[]; workspace: Workspace; showWorkspace?: boolean }> = ({
  tasks,
  workspace,
  showWorkspace = false,
}) => (
  <ul className="workspace-task-list">
    {tasks.map((task) => {
      const completed = task.completed || task.status === 'completed';
      return (
        <li key={task.id} className={completed ? 'is-complete' : ''}>
          <button
            type="button"
            className={`workspace-task-check${completed ? ' is-checked' : ''}`}
            aria-label={`${completed ? 'Reopen' : 'Complete'} ${task.title}`}
            aria-pressed={completed}
            onClick={() => dataService.toggleTask(task.id)}
          >
            {completed ? <Check size={14} /> : null}
          </button>
          <span className="workspace-task-name">{task.title}</span>
          {showWorkspace ? <span className="workspace-task-workspace">{workspace.name}</span> : null}
          <span className="workspace-task-date">
            {task.dueDate || task.deadline || 'No due date'}
          </span>
          <span className={`workspace-priority is-${task.priority.toLowerCase()}`}>{task.priority}</span>
        </li>
      );
    })}
  </ul>
);

const WorkspaceNotesTab: React.FC<{ workspace: Workspace }> = ({ workspace }) => {
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        await noteRepository.init();
        const [allFolders, allNotes] = await Promise.all([noteFolderRepository.getAll(), noteRepository.getAll()]);
        if (!mounted) return;
        setFolders(allFolders);
        const matchingFolderIds = new Set(
          allFolders
            .filter((folder) => folder.name.trim().toLowerCase() === workspace.name.toLowerCase())
            .map((folder) => folder.id),
        );
        const relatedNotes = allNotes.filter((note) => !note.isTrash && matchingFolderIds.has(note.folderId));
        setNotes(relatedNotes);
        setSelectedNoteId((current) =>
          relatedNotes.some((note) => note.id === current) ? current : relatedNotes[0]?.id || '',
        );
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    setIsLoading(true);
    void load();
    const unsubscribeNotes = noteRepository.subscribe(() => void load());
    const unsubscribeFolders = noteFolderRepository.subscribe(() => void load());
    return () => {
      mounted = false;
      unsubscribeNotes();
      unsubscribeFolders();
    };
  }, [workspace.name]);

  const selectedNote = notes.find((note) => note.id === selectedNoteId);
  const filteredNotes = notes.filter((note) => note.title.toLowerCase().includes(search.toLowerCase().trim()));

  const createNote = async () => {
    setIsCreating(true);
    try {
      let folder = folders.find(
        (item) => item.name.trim().toLowerCase() === workspace.name.toLowerCase(),
      );
      if (!folder) {
        folder = await noteFolderRepository.create(workspace.name, workspace.color);
        setFolders((current) => [...current, folder!]);
      }
      const note = await noteRepository.create(folder.id, 'Untitled note');
      setNotes((current) => [note, ...current]);
      setSelectedNoteId(note.id);
    } finally {
      setIsCreating(false);
    }
  };

  const saveTitle = async (note: NoteItem, title: string) => {
    if (title.trim() && title.trim() !== note.title) {
      const updated = await noteRepository.update(note.id, { title: title.trim() });
      setNotes((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    }
  };

  const saveContent = async (noteId: string, content: string) => {
    setIsSaving(true);
    try {
      const updated = await noteRepository.update(noteId, { content });
      setNotes((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      console.error('Unable to save workspace note:', error);
    } finally {
      window.setTimeout(() => setIsSaving(false), 300);
    }
  };

  const navigateToNote = (title: string) => {
    const target = notes.find((note) => note.title.toLowerCase() === title.toLowerCase());
    if (target) setSelectedNoteId(target.id);
  };

  const toggleFavorite = async (note: NoteItem) => {
    await noteRepository.toggleFavorite(note.id);
    setNotes((current) =>
      current.map((item) => (item.id === note.id ? { ...item, isFavorite: !item.isFavorite } : item)),
    );
  };

  return (
    <div className="workspace-content-card workspace-notes-panel">
      <header className="workspace-section-head">
        <div>
          <p className="workspace-kicker">Notebook</p>
          <h2>Notes in {workspace.name}</h2>
        </div>
        <button className="workspace-primary-button" type="button" onClick={() => void createNote()} disabled={isCreating}>
          <Plus size={16} />{isCreating ? 'Creating…' : 'New note'}
        </button>
      </header>
      <div className="workspace-notes-layout">
        <aside className="workspace-notes-list" aria-label="Workspace notes">
          <label className="workspace-search">
            <span className="sr-only">Search workspace notes</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a note" />
          </label>
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              type="button"
              className={selectedNoteId === note.id ? 'is-selected' : ''}
              onClick={() => setSelectedNoteId(note.id)}
            >
              <NotebookPen size={15} />
              <span>{note.title}</span>
            </button>
          ))}
          {!isLoading && !filteredNotes.length ? (
            <p className="workspace-muted">{notes.length ? 'No notes match your search.' : 'No notes in this workspace yet.'}</p>
          ) : null}
        </aside>
        <section className="workspace-note-preview" aria-label="Selected note">
          {selectedNote ? (
            <>
              <label className="workspace-note-title-label">
                <span className="sr-only">Note title</span>
                <input
                  key={selectedNote.id}
                  defaultValue={selectedNote.title}
                  aria-label="Edit note title"
                  onBlur={(event) => void saveTitle(selectedNote, event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur();
                  }}
                />
              </label>
              <div className="workspace-note-editor">
                <NotesEditor
                  key={selectedNote.id}
                  noteId={selectedNote.id}
                  initialContent={selectedNote.content}
                  allNotes={notes}
                  onChange={(content) => void saveContent(selectedNote.id, content)}
                  onNavigateToNote={navigateToNote}
                  isSaving={isSaving}
                />
              </div>
              <button
                type="button"
                className="workspace-secondary-button"
                aria-pressed={selectedNote.isFavorite}
                onClick={() => void toggleFavorite(selectedNote)}
              >
                {selectedNote.isFavorite ? 'Remove favorite' : 'Add to favorites'}
              </button>
            </>
          ) : (
            <EmptyState
              title={isLoading ? 'Loading notes…' : 'Your workspace notebook'}
              detail={isLoading ? 'Reading your saved notebook.' : 'Create a note here to keep workspace ideas together.'}
            />
          )}
        </section>
      </div>
      <p className="workspace-notes-footnote">
        Notes are saved in your existing local notebook. Titles and rich-text content can be edited here.
      </p>
    </div>
  );
};

const WorkspaceCalendarTab: React.FC<{ workspace: Workspace; tasks: TaskItem[] }> = ({ workspace, tasks }) => {
  const [selectedDate, setSelectedDate] = useState(ANCHOR_DATE);
  const [newTitle, setNewTitle] = useState('');
  const dueTasks = tasks.filter((task) => task.dueDate === selectedDate);

  const addDatedTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim()) return;
    dataService.addTask({
      title: newTitle.trim(),
      workspace: workspace.name,
      categoryColor: workspace.color,
      dueDate: selectedDate,
      priority: 'Medium',
    });
    setNewTitle('');
  };

  return (
    <div className="workspace-content-card">
      <header className="workspace-section-head">
        <div>
          <p className="workspace-kicker">Schedule</p>
          <h2>Calendar</h2>
        </div>
        <label className="workspace-date-picker">
          <span>Selected date</span>
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
      </header>
      <form className="workspace-task-create workspace-calendar-create" onSubmit={addDatedTask}>
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          aria-label={`Add a task for ${selectedDate}`}
          placeholder="Add a task for this date"
          required
        />
        <button className="workspace-primary-button" type="submit"><Plus size={16} />Add to calendar</button>
      </form>
      <p className="workspace-calendar-date">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      })}</p>
      {dueTasks.length ? <TaskList tasks={dueTasks} workspace={workspace} /> : (
        <EmptyState title="Nothing scheduled" detail="Choose another date or add a task above." />
      )}
    </div>
  );
};

const WorkspaceAnalyticsTab: React.FC<{ workspace: Workspace; tasks: TaskItem[] }> = ({ workspace, tasks }) => {
  const stats = workspaceStats(workspace, tasks);
  const sessions = dataService.getFocusSessions();
  const taskIds = new Set(tasks.map((task) => task.id));
  const scopedSessions = sessions.filter((session) => session.taskId && taskIds.has(session.taskId));
  const totalFocus = scopedSessions.reduce((total, session) => total + session.durationMinutes, 0);
  const byPriority = (['Critical', 'High', 'Medium', 'Low'] as const).map((priority) => ({
    priority,
    count: tasks.filter((task) => task.priority === priority).length,
  }));

  return (
    <div className="workspace-analytics">
      <div className="workspace-metric-grid">
        <MetricCard label="Completion" value={`${stats.progress}%`} icon={<Check size={18} />} />
        <MetricCard label="Tasks completed" value={`${stats.completed} / ${stats.total}`} icon={<CheckSquare size={18} />} />
        <MetricCard label="Focus sessions" value={scopedSessions.length} icon={<Target size={18} />} />
        <MetricCard label="Recorded focus" value={formatMinutes(totalFocus)} icon={<Clock3 size={18} />} />
      </div>
      <section className="workspace-content-card">
        <header className="workspace-section-head">
          <div><p className="workspace-kicker">Real task data</p><h2>Tasks by priority</h2></div>
        </header>
        <div className="workspace-priority-chart">
          {byPriority.map((item) => (
            <div className="workspace-priority-row" key={item.priority}>
              <span>{item.priority}</span>
              <div className="workspace-progress-track" role="progressbar" aria-label={`${item.priority} tasks`} aria-valuemin={0} aria-valuemax={Math.max(1, stats.total)} aria-valuenow={item.count}>
                <span style={{ width: `${stats.total ? (item.count / stats.total) * 100 : 0}%`, backgroundColor: workspace.color }} />
              </div>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({
  label,
  value,
  icon,
}) => (
  <div className="workspace-metric-card">
    <span className="workspace-metric-icon">{icon}</span>
    <span className="workspace-metric-copy">
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  </div>
);

const EmptyState: React.FC<{ title: string; detail: string }> = ({ title, detail }) => (
  <div className="workspace-empty-state">
    <span>{title}</span>
    <p>{detail}</p>
  </div>
);
