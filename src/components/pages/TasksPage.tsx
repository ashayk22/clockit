import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  MoreHorizontal,
  List,
  Columns,
  Grid,
  ChevronRight,
  ArrowRight,
  Trash2,
  Edit2,
  CircleCheckBig,
  Clock,
  Crosshair,
  AlertCircle,
  X,
  Search,
  Tag,
  CornerDownRight,
  Play,
  RotateCcw,
} from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus } from '../../data/mockData';
import { dataService, ANCHOR_DATE, WORKSPACE_COLORS } from '../../services/dataService';
import {
  selectTasks,
  selectCompletedTasks,
  selectOverdueTasks,
} from '../../services/selectors';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface TasksPageProps {
  tasks?: TaskItem[];
  onToggleTask?: (id: string) => void;
  onNavigateToCalendar?: () => void;
  onNavigateToFocus?: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  onNavigateToCalendar,
  onNavigateToFocus,
}) => {
  // Live reactive tasks from single source of truth
  const [tasks, setTasks] = useState<TaskItem[]>(() => dataService.getTasks());

  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setTasks(dataService.getTasks());
    });
    return unsubscribe;
  }, []);

  // Filter & View State
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'someday' | 'completed' | 'overdue'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'matrix'>('list');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'created' | 'status' | 'workspace'>('deadline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<number | null>(null);
  const [statsTimeRange, setStatsTimeRange] = useState<'week' | 'all'>('week');

  // Board drag & drop
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  // Quick Add input
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // Completion feedback: bump a counter per task so the checkbox replays its pop.
  const [checkedPulse, setCheckedPulse] = useState<Record<string, number>>({});

  // Task Modal (Create & Edit)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('Medium');
  const [formStatus, setFormStatus] = useState<TaskStatus>('todo');
  const [formWorkspace, setFormWorkspace] = useState('Personal');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDueTime, setFormDueTime] = useState('');
  const [formEstimate, setFormEstimate] = useState('1–2 hrs');
  const [formTags, setFormTags] = useState('');
  const [formError, setFormError] = useState('');

  // Delete Confirmation Modal
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  // Row Action Dropdown Menu
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.clockit-task-dropdown-menu') && !target.closest('.clockit-task-menu-btn')) {
        setActiveMenuTaskId(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Escape closes whichever dialog is open — the shared modal affordance.
  useEffect(() => {
    if (!isTaskModalOpen && !taskToDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTaskModalOpen(false);
        setTaskToDelete(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isTaskModalOpen, taskToDelete]);

  // Open Create Modal
  const handleOpenCreateModal = (defaultStatus: TaskStatus = 'todo') => {
    setModalMode('create');
    setEditingTaskId(null);
    setFormTitle('');
    setFormDescription('');
    setFormPriority('Medium');
    setFormStatus(defaultStatus);
    setFormWorkspace('Personal');
    setFormDueDate('');
    setFormDueTime('');
    setFormEstimate('1–2 hrs');
    setFormTags('');
    setFormError('');
    setIsTaskModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (task: TaskItem) => {
    setModalMode('edit');
    setEditingTaskId(task.id);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormWorkspace(task.workspace);
    setFormDueDate(task.dueDate || '');
    setFormDueTime(task.dueTime || '');
    setFormEstimate(task.estimate || '1–2 hrs');
    setFormTags(task.tags ? task.tags.join(', ') : '');
    setFormError('');
    setIsTaskModalOpen(true);
    setActiveMenuTaskId(null);
  };

  // Save Task (Create or Update)
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Task title is required');
      return;
    }

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    if (modalMode === 'create') {
      dataService.addTask({
        title: formTitle.trim(),
        description: formDescription.trim(),
        priority: formPriority,
        status: formStatus,
        workspace: formWorkspace,
        dueDate: formDueDate || undefined,
        dueTime: formDueTime || undefined,
        estimate: formEstimate.trim() || undefined,
        tags: tagsArray,
      });
    } else if (editingTaskId) {
      dataService.updateTask(editingTaskId, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        priority: formPriority,
        status: formStatus,
        workspace: formWorkspace,
        dueDate: formDueDate || undefined,
        dueTime: formDueTime || undefined,
        estimate: formEstimate.trim() || undefined,
        tags: tagsArray,
      });
    }

    setIsTaskModalOpen(false);
  };

  // Quick Add from widget
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    dataService.addTask({
      title: quickTaskTitle.trim(),
      priority: 'Medium',
      workspace: 'Personal',
      status: 'todo',
    });
    setQuickTaskTitle('');
  };

  // Toggle Task Completion
  const handleToggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    const willComplete = !!task && !task.completed;
    dataService.toggleTask(id);
    if (willComplete) {
      setCheckedPulse((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    }
  };

  // Delete Task
  const handleConfirmDelete = () => {
    if (taskToDelete) {
      dataService.deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  // Select Task for Focus Session
  const handleSelectForFocus = (task: TaskItem) => {
    dataService.setSelectedFocusTaskId(task.id);
    setActiveMenuTaskId(null);
    if (onNavigateToFocus) {
      onNavigateToFocus();
    }
  };

  // Set Task Status
  const handleSetStatus = (id: string, status: TaskStatus) => {
    dataService.updateTask(id, { status });
    setActiveMenuTaskId(null);
  };

  // Drop a dragged board card into a new status column
  const handleDropOnStatus = (status: TaskStatus) => {
    if (draggingTaskId) {
      const task = tasks.find((t) => t.id === draggingTaskId);
      if (task && task.status !== status) {
        dataService.updateTask(draggingTaskId, { status });
      }
    }
    setDraggingTaskId(null);
    setDragOverStatus(null);
  };

  // Calendar anchor (design "today") — every month label and date prefix derives from it.
  const anchor = useMemo(() => {
    const [year, month, day] = ANCHOR_DATE.split('-').map(Number);
    return { year, month: month - 1, day };
  }, []);
  const monthPrefix = `${anchor.year}-${String(anchor.month + 1).padStart(2, '0')}-`;
  const monthShort = MONTH_SHORT[anchor.month];
  const monthLabel = `${MONTH_NAMES[anchor.month]} ${anchor.year}`;

  // Dates in the anchor month with task indicators
  const taskDaysSet = useMemo(() => {
    const days = new Set<number>();
    tasks.forEach((t) => {
      if (t.dueDate && t.dueDate.startsWith(monthPrefix)) {
        const day = parseInt(t.dueDate.split('-')[2], 10);
        if (!isNaN(day)) days.add(day);
      }
    });
    return days;
  }, [tasks, monthPrefix]);

  // Filter & Sort Tasks — the shared selector, so this page and HomePage agree
  // on what "today"/"overdue" mean and how tasks order.
  const filteredAndSortedTasks = useMemo(() => {
    // Map the mini-calendar selection onto an exact due date (YYYY-MM-DD).
    const dueDate =
      selectedCalendarDate === null
        ? null
        : `${monthPrefix}${String(selectedCalendarDate).padStart(2, '0')}`;
    return selectTasks(tasks, { filter: activeFilter, sortBy, dueDate, searchQuery });
  }, [tasks, activeFilter, selectedCalendarDate, searchQuery, sortBy, monthPrefix]);

  // Dynamic Task Statistics — counts come from the shared selectors.
  const stats = useMemo(() => {
    const relevantTasks = statsTimeRange === 'week' ? tasks.slice(0, 8) : tasks;
    const completedCount = selectCompletedTasks(relevantTasks).length;
    const overdueCount = selectOverdueTasks(relevantTasks).length;
    const pendingCount = Math.max(0, relevantTasks.length - completedCount - overdueCount);
    const totalCount = relevantTasks.length || 1;
    const percent = Math.round((completedCount / totalCount) * 100);

    return {
      completedCount,
      overdueCount,
      pendingCount,
      totalCount,
      percent,
    };
  }, [tasks, statsTimeRange]);

  // Donut circumference for r=34 is 2 * PI * 34 ~= 213.6
  const donutCircumference = 213.6;
  const strokeDashoffset = donutCircumference * (1 - stats.completedCount / Math.max(1, stats.totalCount));

  // Dynamic month grid for the anchor month (Monday-first), matching HomePage.
  const calendarDays = useMemo(() => {
    const firstDayIndex = (new Date(anchor.year, anchor.month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(anchor.year, anchor.month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [anchor]);

  // Helper for priority order badge
  const renderPriorityBadge = (priority: TaskPriority) => (
    <span className={`clockit-priority-badge ${priority}`}>{priority}</span>
  );

  return (
    <div className="clockit-page-container">
      {/* 1. Header Row */}
      <div className="clockit-page-header-row">
        <div>
          <h1 className="clockit-page-title">Tasks</h1>
          <p className="clockit-page-subtitle">Turn your plans into progress.</p>
        </div>
        <button
          className="clockit-primary-btn"
          onClick={() => handleOpenCreateModal()}
          type="button"
          aria-label="Add Task"
        >
          <Plus size={15} />
          <span>Add Task</span>
        </button>
      </div>

      {/* 2. Main 2-Column Layout */}
      <div className="clockit-tasks-columns">
        {/* Left Column: Task Board Card */}
        <section className="clockit-card" style={{ padding: 20 }}>
          {/* Controls Bar: Filters & View Toggles */}
          <div className="clockit-tasks-filter-bar">
            <div className="clockit-filter-pills" role="tablist">
              {(
                [
                  { key: 'all', label: 'All Tasks' },
                  { key: 'today', label: 'Today' },
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'someday', label: 'Someday' },
                  { key: 'completed', label: 'Completed' },
                  { key: 'overdue', label: 'Overdue' },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  className={`clockit-filter-pill ${activeFilter === key ? 'active' : ''}`}
                  onClick={() => {
                    setActiveFilter(key);
                    setSelectedCalendarDate(null);
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}

              {selectedCalendarDate !== null && (
                <button
                  className="clockit-filter-pill active"
                  style={{ background: 'var(--accent-mint)', color: '#0f1115', display: 'flex', alignItems: 'center', gap: 5 }}
                  onClick={() => setSelectedCalendarDate(null)}
                  type="button"
                >
                  <span>{monthShort} {selectedCalendarDate}</span>
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="clockit-tasks-sort">
              {/* Search input */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={13} style={{ position: 'absolute', left: 7, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="clockit-quick-add-input"
                  style={{ height: 26, fontSize: 11.5, paddingLeft: 24, width: 130 }}
                  aria-label="Search tasks"
                />
              </div>

              <span>Sort by</span>
              <select
                className="clockit-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort tasks"
              >
                <option value="deadline">Deadline (Nearest)</option>
                <option value="priority">Priority (Highest)</option>
                <option value="created">Creation Date</option>
                <option value="status">Status</option>
                <option value="workspace">Workspace</option>
              </select>

              {/* View Mode Switchers */}
              <div style={{ display: 'flex', gap: 2, background: 'var(--bg-surface-subtle)', padding: 2, borderRadius: 6 }}>
                <button
                  className={`clockit-icon-action-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                  type="button"
                >
                  <List size={14} />
                </button>
                <button
                  className={`clockit-icon-action-btn ${viewMode === 'board' ? 'active' : ''}`}
                  onClick={() => setViewMode('board')}
                  title="Board view"
                  type="button"
                >
                  <Columns size={14} />
                </button>
                <button
                  className={`clockit-icon-action-btn ${viewMode === 'matrix' ? 'active' : ''}`}
                  onClick={() => setViewMode('matrix')}
                  title="Matrix view"
                  type="button"
                >
                  <Grid size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* VIEW 1: LIST VIEW (Reference Matching) */}
          {viewMode === 'list' && (
            <div className="clockit-tasks-list">
              {filteredAndSortedTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '42px 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
                  <AlertCircle size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.5 }} />
                  <span>No tasks match this filter or search.</span>
                </div>
              ) : (
                filteredAndSortedTasks.map((task) => (
                  <div key={task.id} className="clockit-task-row" style={{ position: 'relative' }}>
                    <div className="clockit-task-left">
                      <div
                        key={`${task.id}-${checkedPulse[task.id] ?? 0}`}
                        className={`clockit-task-checkbox ${task.completed ? 'checked' : ''} ${
                          task.completed && (checkedPulse[task.id] ?? 0) > 0 ? 'just-checked' : ''
                        }`}
                        onClick={() => handleToggleTask(task.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleToggleTask(task.id);
                          }
                        }}
                        role="checkbox"
                        aria-checked={task.completed}
                        aria-label={task.title}
                        tabIndex={0}
                        title={task.completed ? 'Reopen task' : 'Mark as complete'}
                      >
                        {task.completed && '✓'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span
                          className={`clockit-task-title ${task.completed ? 'completed' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleOpenEditModal(task)}
                          title="Click to edit task"
                        >
                          {task.title}
                        </span>
                        {task.description && (
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="clockit-task-right">
                      {/* Workspace Tag */}
                      <span className="clockit-task-workspace-tag">
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            backgroundColor: task.categoryColor || WORKSPACE_COLORS[task.workspace] || '#22c55e',
                          }}
                        />
                        <span>{task.workspace}</span>
                      </span>

                      {/* Deadline & Overdue */}
                      <span className={`clockit-task-deadline ${task.isOverdue && !task.completed ? 'overdue' : ''}`}>
                        <CalendarIcon size={13} color={task.isOverdue && !task.completed ? '#ef4444' : 'var(--text-muted)'} />
                        <span>
                          {task.deadline} {task.daysLeft ? `(${task.daysLeft})` : ''}
                        </span>
                      </span>

                      {/* Priority Badge */}
                      {renderPriorityBadge(task.priority)}

                      {/* Three-dots Menu Button */}
                      <button
                        className="clockit-icon-action-btn clockit-task-menu-btn"
                        aria-label="More task options"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id);
                        }}
                      >
                        <MoreHorizontal size={15} />
                      </button>

                      {/* Task Dropdown Menu */}
                      {activeMenuTaskId === task.id && (
                        <div
                          className="clockit-card clockit-task-dropdown-menu"
                          style={{
                            position: 'absolute',
                            right: 14,
                            top: 40,
                            zIndex: 80,
                            width: 170,
                            padding: '6px',
                            boxShadow: 'var(--shadow-hover)',
                            border: '1px solid var(--border-strong)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="clockit-nav-item"
                            style={{ padding: '6px 8px', fontSize: 12, justifyContent: 'flex-start' }}
                            onClick={() => handleOpenEditModal(task)}
                          >
                            <Edit2 size={13} />
                            <span>Edit Task</span>
                          </button>

                          <button
                            type="button"
                            className="clockit-nav-item"
                            style={{ padding: '6px 8px', fontSize: 12, justifyContent: 'flex-start' }}
                            onClick={() => handleSelectForFocus(task)}
                          >
                            <Crosshair size={13} color="var(--accent-mint)" />
                            <span>Focus in Timer</span>
                          </button>

                          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

                          {task.status !== 'in-progress' && (
                            <button
                              type="button"
                              className="clockit-nav-item"
                              style={{ padding: '6px 8px', fontSize: 12, justifyContent: 'flex-start' }}
                              onClick={() => handleSetStatus(task.id, 'in-progress')}
                            >
                              <Play size={13} color="#3b82f6" />
                              <span>Set In Progress</span>
                            </button>
                          )}

                          {task.status !== 'completed' ? (
                            <button
                              type="button"
                              className="clockit-nav-item"
                              style={{ padding: '6px 8px', fontSize: 12, justifyContent: 'flex-start' }}
                              onClick={() => handleSetStatus(task.id, 'completed')}
                            >
                              <CircleCheckBig size={13} color="#22c55e" />
                              <span>Mark Complete</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="clockit-nav-item"
                              style={{ padding: '6px 8px', fontSize: 12, justifyContent: 'flex-start' }}
                              onClick={() => handleSetStatus(task.id, 'todo')}
                            >
                              <RotateCcw size={13} />
                              <span>Reopen Task</span>
                            </button>
                          )}

                          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

                          <button
                            type="button"
                            className="clockit-nav-item"
                            style={{ padding: '6px 8px', fontSize: 12, justifyContent: 'flex-start', color: '#ef4444' }}
                            onClick={() => {
                              setTaskToDelete(task);
                              setActiveMenuTaskId(null);
                            }}
                          >
                            <Trash2 size={13} color="#ef4444" />
                            <span>Delete Task</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* VIEW 2: KANBAN BOARD VIEW */}
          {viewMode === 'board' && (
            <div className="clockit-board-columns">
              {(
                [
                  { status: 'todo' as TaskStatus, title: 'To Do', color: '#9ca3af' },
                  { status: 'in-progress' as TaskStatus, title: 'In Progress', color: '#3b82f6' },
                  { status: 'completed' as TaskStatus, title: 'Completed', color: '#22c55e' },
                ] as const
              ).map((col) => {
                const colTasks = filteredAndSortedTasks.filter((t) => t.status === col.status);
                const isDropTarget = dragOverStatus === col.status;
                return (
                  <div
                    key={col.status}
                    className={`clockit-board-column${isDropTarget ? ' is-drag-over' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverStatus !== col.status) setDragOverStatus(col.status);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverStatus((s) => (s === col.status ? null : s));
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropOnStatus(col.status);
                    }}
                  >
                    <div className="clockit-board-column-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color }} />
                        <span>{col.title}</span>
                        <span className="clockit-board-badge">{colTasks.length}</span>
                      </div>
                      <button
                        type="button"
                        className="clockit-icon-action-btn"
                        style={{ padding: 2 }}
                        title={`Add task to ${col.title}`}
                        onClick={() => handleOpenCreateModal(col.status)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="clockit-board-cards-list">
                      {colTasks.length === 0 ? (
                        <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                          No tasks in {col.title}
                        </div>
                      ) : (
                        colTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`clockit-board-card${draggingTaskId === task.id ? ' is-dragging' : ''}`}
                            draggable
                            onDragStart={() => setDraggingTaskId(task.id)}
                            onDragEnd={() => {
                              setDraggingTaskId(null);
                              setDragOverStatus(null);
                            }}
                            onClick={() => handleOpenEditModal(task)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="clockit-task-workspace-tag">
                                <span
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: task.categoryColor || '#22c55e',
                                  }}
                                />
                                <span>{task.workspace}</span>
                              </span>
                              {renderPriorityBadge(task.priority)}
                            </div>

                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 550,
                                color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                                textDecoration: task.completed ? 'line-through' : 'none',
                              }}
                            >
                              {task.title}
                            </span>

                            {task.description && (
                              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: 0, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {task.description}
                              </p>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 6, borderTop: '1px solid var(--border-subtle)', fontSize: 11 }}>
                              <span className={`clockit-task-deadline ${task.isOverdue && !task.completed ? 'overdue' : ''}`} style={{ fontSize: 11 }}>
                                <CalendarIcon size={11} />
                                <span>{task.daysLeft || task.deadline}</span>
                              </span>

                              <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="clockit-icon-action-btn"
                                  style={{ padding: 2 }}
                                  title="Focus in timer"
                                  onClick={() => handleSelectForFocus(task)}
                                >
                                  <Crosshair size={12} color="var(--accent-mint)" />
                                </button>
                                <button
                                  type="button"
                                  className="clockit-icon-action-btn"
                                  style={{ padding: 2 }}
                                  title="Delete task"
                                  onClick={() => setTaskToDelete(task)}
                                >
                                  <Trash2 size={12} color="#ef4444" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 3: EISENHOWER MATRIX VIEW */}
          {viewMode === 'matrix' && (
            <div className="clockit-matrix-grid">
              {(
                [
                  {
                    title: 'Q1: Urgent & Important',
                    filter: (t: TaskItem) => (t.priority === 'Critical' || t.priority === 'High') && (t.isOverdue || t.isToday || t.daysLeft.includes('days left')),
                    badgeColor: '#ef4444',
                    desc: 'Do immediately',
                  },
                  {
                    title: 'Q2: Important, Not Urgent',
                    filter: (t: TaskItem) => (t.priority === 'Critical' || t.priority === 'High') && (!t.dueDate || t.daysLeft === 'Someday' || (!t.isOverdue && !t.isToday && !t.daysLeft.includes('days left'))),
                    badgeColor: '#3b82f6',
                    desc: 'Schedule focus time',
                  },
                  {
                    title: 'Q3: Urgent, Not Important',
                    filter: (t: TaskItem) => (t.priority === 'Medium' || t.priority === 'Low') && (t.isOverdue || t.isToday || t.daysLeft.includes('days left')),
                    badgeColor: '#f59e0b',
                    desc: 'Delegate or streamline',
                  },
                  {
                    title: 'Q4: Not Urgent, Not Important',
                    filter: (t: TaskItem) => (t.priority === 'Medium' || t.priority === 'Low') && (!t.dueDate || t.daysLeft === 'Someday'),
                    badgeColor: '#10b981',
                    desc: 'Drop or do later',
                  },
                ] as const
              ).map((quadrant, idx) => {
                const qTasks = filteredAndSortedTasks.filter(quadrant.filter);
                return (
                  <div key={idx} className="clockit-matrix-quadrant">
                    <div className="clockit-matrix-quadrant-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: quadrant.badgeColor }} />
                          <span style={{ fontWeight: 650 }}>{quadrant.title}</span>
                          <span className="clockit-board-badge">{qTasks.length}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{quadrant.desc}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 70 }}>
                      {qTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: 'var(--text-muted)' }}>
                          No tasks in this quadrant
                        </div>
                      ) : (
                        qTasks.map((task) => (
                          <div
                            key={task.id}
                            className="clockit-board-card"
                            style={{ padding: '8px 10px', gap: 4 }}
                            onClick={() => handleOpenEditModal(task)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>
                                {task.title}
                              </span>
                              {renderPriorityBadge(task.priority)}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                              <span>{task.workspace}</span>
                              <span>{task.daysLeft || task.deadline}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Widgets */}
        <aside className="clockit-widgets-column">
          {/* 1. Interactive Calendar Widget */}
          <div className="clockit-widget-card">
            <div className="clockit-widget-header">
              <span className="clockit-widget-title">Calendar</span>
              <button
                className="clockit-icon-action-btn"
                onClick={onNavigateToCalendar}
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-secondary)' }}
                type="button"
              >
                <span>View all</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 12.5, fontWeight: 600 }}>
              <span>{monthLabel}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="clockit-icon-action-btn" style={{ padding: 2 }} type="button">&lt;</button>
                <button className="clockit-icon-action-btn" style={{ padding: 2 }} type="button">&gt;</button>
              </div>
            </div>

            <div className="clockit-calendar-grid">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className="clockit-calendar-day-header">{day}</div>
              ))}
              {calendarDays.map((date, idx) => {
                const isEmpty = date === null;
                const hasTask = date !== null && taskDaysSet.has(date);
                const isSelected = date !== null && selectedCalendarDate === date;
                const isTodayDate = date !== null && date === anchor.day;
                return (
                  <div
                    key={idx}
                    className={`clockit-calendar-day${isEmpty ? ' is-empty' : ''}${isTodayDate ? ' active' : ''}${hasTask ? ' has-task' : ''}${isSelected ? ' selected' : ''}`}
                    aria-hidden={isEmpty || undefined}
                    style={isSelected ? { outline: '2px solid var(--accent-mint)', outlineOffset: 1 } : undefined}
                    onClick={() => {
                      if (date === null) return;
                      setSelectedCalendarDate(selectedCalendarDate === date ? null : date);
                    }}
                    title={hasTask ? `Tasks due on ${monthShort} ${date}` : undefined}
                  >
                    {isEmpty ? '' : date}
                  </div>
                );
              })}
            </div>

            {selectedCalendarDate !== null && (
              <div style={{ marginTop: 10, textAlign: 'center' }}>
                <button
                  type="button"
                  className="clockit-filter-pill"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => setSelectedCalendarDate(null)}
                >
                  Clear date filter ({monthShort} {selectedCalendarDate})
                </button>
              </div>
            )}
          </div>

          {/* 2. Dynamic Task Stats Widget */}
          <div className="clockit-widget-card">
            <div className="clockit-widget-header">
              <span className="clockit-widget-title">Task Stats</span>
              <select
                className="clockit-sort-select"
                style={{ fontSize: 11.5 }}
                value={statsTimeRange}
                onChange={(e) => setStatsTimeRange(e.target.value as any)}
                aria-label="Task stats scope"
              >
                <option value="week">This week</option>
                <option value="all">All tasks</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Dynamic Donut Progress Ring */}
              <div className="clockit-focus-donut-wrap">
                <svg width="86" height="86" viewBox="0 0 86 86">
                  <circle cx="43" cy="43" r="34" fill="none" stroke="var(--bg-surface-subtle)" strokeWidth="8" />
                  <circle
                    cx="43"
                    cy="43"
                    r="34"
                    fill="none"
                    stroke="var(--accent-mint)"
                    strokeWidth="8"
                    strokeDasharray={donutCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 43 43)"
                    style={{ transition: 'stroke-dashoffset 600ms var(--motion-ease-out)' }}
                  />
                </svg>
                <div className="clockit-focus-donut-text">
                  <div style={{ fontSize: 15 }}>
                    {stats.completedCount} / {stats.totalCount}
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 500 }}>Tasks done</div>
                </div>
              </div>

              {/* Dynamic Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span>{stats.completedCount} Completed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#9ca3af' }} />
                  <span>{stats.pendingCount} Pending</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <span>{stats.overdueCount} Overdue</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Quick Add Card */}
          <div className="clockit-widget-card">
            <strong style={{ fontSize: 13.5, color: 'var(--text-primary)', display: 'block', marginBottom: 10 }}>
              Quick Add
            </strong>
            <form onSubmit={handleQuickAdd} className="clockit-notes-input-wrap">
              <input
                type="text"
                placeholder="+ Add a task..."
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                aria-label="Add a task"
              />
              <button type="submit" className="clockit-icon-action-btn" style={{ padding: 2 }} aria-label="Submit task">
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* MODAL 1: Create & Edit Task Modal */}
      {isTaskModalOpen && (
        <div className="clockit-modal-scrim" onClick={() => setIsTaskModalOpen(false)}>
          <div
            className="clockit-card clockit-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label={modalMode === 'create' ? 'Create new task' : 'Edit task'}
            style={{ width: 480, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, margin: 0, color: 'var(--text-primary)' }}>
                {modalMode === 'create' ? 'Create New Task' : 'Edit Task'}
              </h2>
              <button
                type="button"
                className="clockit-icon-action-btn"
                onClick={() => setIsTaskModalOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Title */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>Title *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Prepare for Database Presentation"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (formError) setFormError('');
                  }}
                  className="clockit-quick-add-input"
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>Description / Notes</label>
                <textarea
                  placeholder="Add details, links, or sub-tasks..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="clockit-quick-add-input"
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 70, resize: 'vertical', paddingTop: 8, fontFamily: 'inherit' }}
                />
              </div>

              {/* Priority & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="clockit-sort-select"
                    style={{ width: '100%', height: 38, marginTop: 4 }}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="clockit-sort-select"
                    style={{ width: '100%', height: 38, marginTop: 4 }}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Workspace & Estimated Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>Workspace</label>
                  <select
                    value={formWorkspace}
                    onChange={(e) => setFormWorkspace(e.target.value)}
                    className="clockit-sort-select"
                    style={{ width: '100%', height: 38, marginTop: 4 }}
                  >
                    <option value="Personal">Personal</option>
                    <option value="College">College</option>
                    <option value="Club">Club</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Development">Development</option>
                    <option value="SIH">SIH</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>Estimated Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 2–3 hrs"
                    value={formEstimate}
                    onChange={(e) => setFormEstimate(e.target.value)}
                    className="clockit-quick-add-input"
                    style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                  />
                </div>
              </div>

              {/* Due Date & Due Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="clockit-quick-add-input"
                    style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>Due Time (Optional)</label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="clockit-quick-add-input"
                    style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. #college, #exam, #design"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="clockit-quick-add-input"
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="clockit-filter-pill"
                  onClick={() => setIsTaskModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="clockit-primary-btn">
                  {modalMode === 'create' ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="clockit-modal-scrim" onClick={() => setTaskToDelete(null)}>
          <div
            className="clockit-card clockit-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Delete task confirmation"
            style={{ width: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 17, margin: '0 0 8px', color: 'var(--text-primary)' }}>
              Delete Task?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Are you sure you want to delete &ldquo;<strong>{taskToDelete.title}</strong>&rdquo;? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                autoFocus
                className="clockit-filter-pill"
                onClick={() => setTaskToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="clockit-primary-btn"
                style={{ background: '#ef4444' }}
                onClick={handleConfirmDelete}
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
