import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Calendar as CalendarIcon,
  Play,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
  Send,
  Maximize2,
  CheckCircle2,
  Trash2,
  Edit2,
  Crosshair,
  RotateCcw,
  X,
  AlertCircle,
  Tag,
  Clock,
  CalendarClock,
} from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus } from '../../data/mockData';
import { dataService, ANCHOR_DATE, WORKSPACE_COLORS } from '../../services/dataService';
import {
  selectTasks,
  selectTodayTasks,
  selectOverdueTasks,
  selectUpcomingTasks,
  selectCompletedTasks,
  TASK_PRIORITY_RANK,
} from '../../services/selectors';
import { useAuth } from '../../auth/AuthContext';
import { OnboardingWelcomeBanner } from '../onboarding/OnboardingWelcomeBanner';
import { useOnboarding } from '../onboarding/OnboardingContext';
import { QuickNotesCard } from '../notes/QuickNotesCard';

interface HomePageProps {
  tasks?: TaskItem[];
  onToggleTask?: (id: string) => void;
  onNavigateToFocus?: () => void;
  onNavigateToTasks?: () => void;
  onNavigateToCalendar?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToFocus,
  onNavigateToTasks,
  onNavigateToCalendar,
}) => {
  // Live reactive tasks from unified data store
  const [tasks, setTasks] = useState<TaskItem[]>(() => dataService.getTasks());
  const [quickNotes, setQuickNotes] = useState<string[]>(() => dataService.getQuickNotes());
  const { user } = useAuth();
  const { startTutorial } = useOnboarding();

  // Completion feedback: bump a counter per task so the checkbox replays its pop.
  const [checkedPulse, setCheckedPulse] = useState<Record<string, number>>({});

  // A. Greeting and daily context — real signed-in name + the app's anchored day.
  const dailyContext = useMemo(() => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const firstName = (user?.name || 'there').trim().split(/\s+/)[0];
    const anchor = new Date(`${ANCHOR_DATE}T00:00:00`);
    const longDate = anchor.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return { greeting, firstName, longDate };
  }, [user]);

  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setTasks(dataService.getTasks());
      setQuickNotes(dataService.getQuickNotes());
    });
    return unsubscribe;
  }, []);

  // Filter & Sort States
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'someday' | 'completed' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'workspace'>('deadline');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickNote, setQuickNote] = useState('');

  // Calendar Widget Month/Year Navigation
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(9); // 0-indexed: 9 = October
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<number | null>(null);

  // Focus Stats Timeframe
  const [focusTimeRange, setFocusTimeRange] = useState<'today' | 'week'>('today');

  // Task Edit Modal & Action Menu States
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Form fields for editing
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('Medium');
  const [formStatus, setFormStatus] = useState<TaskStatus>('todo');
  const [formWorkspace, setFormWorkspace] = useState('Personal');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDueTime, setFormDueTime] = useState('');
  const [formEstimate, setFormEstimate] = useState('1–2 hrs');
  const [formTags, setFormTags] = useState('');

  // Close dropdown on outside click
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
    if (!isEditModalOpen && !taskToDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditModalOpen(false);
        setTaskToDelete(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isEditModalOpen, taskToDelete]);

  // Open Task Edit Modal
  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormWorkspace(task.workspace);
    setFormDueDate(task.dueDate || '');
    setFormDueTime(task.dueTime || '');
    setFormEstimate(task.estimate || '1–2 hrs');
    setFormTags(task.tags ? task.tags.join(', ') : '');
    setIsEditModalOpen(true);
    setActiveMenuTaskId(null);
  };

  // Save Task Edits
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !formTitle.trim()) return;

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    dataService.updateTask(editingTask.id, {
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

    setIsEditModalOpen(false);
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

  // Start Focus on a specific task
  const handleFocusTask = (task: TaskItem) => {
    dataService.setSelectedFocusTaskId(task.id);
    setActiveMenuTaskId(null);
    if (onNavigateToFocus) {
      onNavigateToFocus();
    }
  };

  // Change Task Status
  const handleSetStatus = (id: string, status: TaskStatus) => {
    dataService.updateTask(id, { status });
    setActiveMenuTaskId(null);
  };

  // STEP 3: Identify the Next Priority / Next In Line task
  const nextTask = useMemo(() => {
    const pendingTasks = tasks.filter((t) => !t.completed && t.status !== 'completed');
    if (pendingTasks.length === 0) return null;

    // Intelligent Priority Ranking (shared ranking table — single source of truth):
    // 1. Overdue Critical tasks
    // 2. Overdue High tasks
    // 3. Other Overdue tasks
    // 4. Critical priority tasks (by nearest due date)
    // 5. High priority tasks (by nearest due date)
    // 6. Nearest upcoming deadline
    // 7. General priority
    const sorted = [...pendingTasks].sort((a, b) => {
      // Overdue takes top precedence
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;

      // Critical priority tasks
      if (a.priority === 'Critical' && b.priority !== 'Critical') return -1;
      if (a.priority !== 'Critical' && b.priority === 'Critical') return 1;

      // Due date comparison
      if (a.dueDate && b.dueDate) {
        if (a.dueDate !== b.dueDate) {
          const pDiff = TASK_PRIORITY_RANK[b.priority] - TASK_PRIORITY_RANK[a.priority];
          if (pDiff >= 2) return 1; // Significant priority difference
          if (pDiff <= -2) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
      } else if (a.dueDate && !b.dueDate) {
        return -1;
      } else if (!a.dueDate && b.dueDate) {
        return 1;
      }

      // Tiebreaker: Priority
      return TASK_PRIORITY_RANK[b.priority] - TASK_PRIORITY_RANK[a.priority];
    });

    return sorted[0] || null;
  }, [tasks]);

  // Start Focus on the Next In Line Task
  const handleStartFocusNextTask = () => {
    if (nextTask) {
      dataService.setSelectedFocusTaskId(nextTask.id);
    }
    if (onNavigateToFocus) {
      onNavigateToFocus();
    }
  };

  // STEP 2: Filter and sort tasks for the overview table (shared selector).
  const filteredTasks = useMemo(() => {
    const dueDate =
      selectedCalendarDate === null
        ? null
        : `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(
            selectedCalendarDate,
          ).padStart(2, '0')}`;
    return selectTasks(tasks, { filter: activeFilter, sortBy, dueDate });
  }, [tasks, activeFilter, selectedCalendarDate, calendarMonth, calendarYear, sortBy]);

  // Today Tasks for the widget — the shared definition of "today".
  const todayTasks = useMemo(() => selectTodayTasks(tasks), [tasks]);

  const todayCompletedCount = useMemo(() => selectCompletedTasks(todayTasks).length, [todayTasks]);

  // Real overdue count — powers the "what is overdue?" answer at a glance.
  const overdueTasks = useMemo(() => selectOverdueTasks(tasks), [tasks]);

  // Real upcoming count — what is coming up next.
  const upcomingTasks = useMemo(() => selectUpcomingTasks(tasks), [tasks]);

  // Add Today Task from Quick Add form
  const handleAddTodayTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    dataService.addTodayTask(quickTaskTitle);
    setQuickTaskTitle('');
  };

  // Add Quick Note
  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNote.trim()) return;
    dataService.addQuickNote(quickNote);
    setQuickNote('');
  };

  // STEP 4: Real Focus Statistics from recorded sessions
  const focusStats = useMemo(() => {
    return dataService.getFocusStats();
  }, [tasks]);

  // Donut ring offset calculation (213 is circumference for r=34)
  const donutCircumference = 213;
  const donutOffset = Math.max(0, donutCircumference * (1 - focusStats.percentage / 100));

  // STEP 5: Dynamic Calendar Month Grid & Task Indicators
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calendarDays = useMemo(() => {
    // 0-indexed day of week: Monday=0, Sunday=6
    const firstDayIndex = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    // Pad to full rows (multiple of 7)
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    return days;
  }, [calendarYear, calendarMonth]);

  // Set of dates in current calendar month that have tasks due
  const taskDaysInMonth = useMemo(() => {
    const monthStr = String(calendarMonth + 1).padStart(2, '0');
    const prefix = `${calendarYear}-${monthStr}-`;
    const set = new Set<number>();
    tasks.forEach((t) => {
      if (t.dueDate && t.dueDate.startsWith(prefix)) {
        const day = parseInt(t.dueDate.split('-')[2], 10);
        if (!isNaN(day)) set.add(day);
      }
    });
    return set;
  }, [tasks, calendarYear, calendarMonth]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear((prev) => prev - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth((prev) => prev - 1);
    }
    setSelectedCalendarDate(null);
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear((prev) => prev + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth((prev) => prev + 1);
    }
    setSelectedCalendarDate(null);
  };

  return (
    <div className="clockit-home-container">
      <OnboardingWelcomeBanner onStartTour={startTutorial} />
      {/* 1. Hero Banner */}
      <section className="clockit-hero-card" aria-label="Greeting and Immediate Priorities">
        <div className="clockit-hero-overlay" />

        {/* Top greeting row */}
        <div className="clockit-hero-top">
          {/* Mountain-sunset backdrop — the same decorative treatment used on the
              landing hero. It is anchored to the greeting row itself, so the
              scene rises out of the base of the greeting composition and its
              right edge lines up with the quote above it and the primary-task
              panel below it, rather than floating in a strip on the card edge. */}
          <div className="clockit-hero-mountains" aria-hidden="true">
            <svg className="mountain-backdrop-svg" viewBox="0 0 800 240" preserveAspectRatio="xMaxYMax meet">
              <defs>
                <radialGradient id="heroSunGlow" cx="680" cy="95" r="90">
                  <stop offset="0%" stopColor="#fde7d3" stopOpacity="0.85" />
                  <stop offset="55%" stopColor="#f8c9a8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f8c9a8" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="heroMtnSun" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f4b98a" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#e99466" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="heroMtnBack" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e8ddd2" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#fdfbf8" stopOpacity="0.15" />
                </linearGradient>
                <linearGradient id="heroMtnMid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d8c8bb" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#f5efe8" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="heroMtnFront" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#bda89a" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#ece3db" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Sun glow + disk */}
              <circle cx="680" cy="95" r="90" fill="url(#heroSunGlow)" />
              <circle cx="680" cy="95" r="42" fill="url(#heroMtnSun)" />

              {/* Soft drifting clouds */}
              <g fill="#ffffff" opacity="0.5">
                <ellipse cx="520" cy="70" rx="42" ry="9" />
                <ellipse cx="560" cy="62" rx="30" ry="7" />
                <ellipse cx="430" cy="95" rx="34" ry="7" />
              </g>

              {/* Birds in flight */}
              <g fill="none" stroke="#7a6a5e" strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
                <path d="M330,58 q6,-6 12,0 q6,-6 12,0" />
                <path d="M360,46 q5,-5 10,0 q5,-5 10,0" />
                <path d="M300,72 q5,-5 10,0 q5,-5 10,0" />
              </g>

              {/* Far mountain range */}
              <path d="M0,240 L0,170 L120,120 L210,150 L300,108 L400,142 L500,115 L600,145 L700,120 L800,150 L800,240 Z" fill="url(#heroMtnBack)" />
              {/* Mid range */}
              <path d="M0,240 L0,190 L100,155 L200,178 L310,148 L420,172 L530,150 L640,175 L740,155 L800,170 L800,240 Z" fill="url(#heroMtnMid)" />
              {/* Contour lines on the mid hill */}
              <g fill="none" stroke="#bda89a" strokeWidth="1" opacity="0.4">
                <path d="M120,200 Q260,180 400,200 Q540,220 680,198" />
                <path d="M140,212 Q280,194 420,212 Q560,230 700,210" />
                <path d="M160,224 Q300,208 440,224 Q580,240 720,222" />
              </g>
              {/* Front rolling hills */}
              <path d="M0,240 L0,205 Q120,180 240,200 Q360,220 480,196 Q600,172 720,200 Q760,208 800,200 L800,240 Z" fill="url(#heroMtnFront)" />

              {/* Foliage — a few tree clusters on the front ridge */}
              <g fill="#6b8f5e" opacity="0.85">
                <ellipse cx="150" cy="200" rx="14" ry="10" />
                <ellipse cx="162" cy="196" rx="10" ry="8" />
                <ellipse cx="620" cy="192" rx="12" ry="9" />
                <ellipse cx="632" cy="188" rx="9" ry="7" />
              </g>
              <g fill="#557a4a" opacity="0.8">
                <ellipse cx="470" cy="198" rx="11" ry="8" />
                <ellipse cx="480" cy="194" rx="8" ry="6" />
              </g>
            </svg>
          </div>

          <div className="clockit-hero-greeting">
            <p className="clockit-hero-greeting-label">{dailyContext.greeting.toUpperCase()}</p>
            <h1 className="clockit-hero-greeting-title">{dailyContext.firstName}.</h1>
            <p className="clockit-hero-greeting-tagline">Track · Focus · Build Momentum.</p>
            <p className="clockit-hero-greeting-matters">
              <span className="clockit-hero-greeting-date">{dailyContext.longDate}</span>
              <span className="clockit-hero-greeting-sep" aria-hidden="true">
                ·
              </span>
              <span>Here's your progress for today.</span>
            </p>
          </div>
          <div className="clockit-hero-quote">
            “Discipline today for a freer tomorrow.”
          </div>
        </div>

        {/* Primary task + integrated focus action — one cohesive surface */}
        <div className="clockit-hero-panel">
          {nextTask ? (
            <div className="clockit-hero-primary">
              <div className="clockit-hero-primary-head">
                <span className="clockit-hero-eyebrow">Next in line</span>
                <span
                  className={`clockit-status${nextTask.priority === 'Critical' ? ' is-critical' : ''}`}
                >
                  <span
                    className="clockit-status-dot"
                    style={{
                      background:
                        nextTask.priority === 'Critical'
                          ? '#ef4444'
                          : nextTask.priority === 'High'
                          ? '#f59e0b'
                          : '#94a3b8',
                    }}
                  />
                  {nextTask.priority}
                </span>
                {nextTask.isOverdue && (
                  <span className="clockit-status is-overdue">
                    <span className="clockit-status-dot" style={{ background: '#ef4444' }} />
                    Overdue
                  </span>
                )}
              </div>

              <h2
                className="clockit-hero-primary-title"
                onClick={() => handleOpenEdit(nextTask)}
                title="Click to view task details"
              >
                {nextTask.title}
              </h2>

              <div className="clockit-hero-primary-meta">
                <span className="clockit-hero-meta-item">
                  <FileText size={13} />
                  <span>{nextTask.workspace}</span>
                </span>
                <span
                  className={`clockit-hero-meta-item${nextTask.isOverdue ? ' is-overdue' : ''}`}
                >
                  <CalendarIcon size={13} />
                  <span>
                    {nextTask.deadline}
                    {nextTask.daysLeft ? ` · ${nextTask.daysLeft}` : ''}
                  </span>
                </span>
              </div>

              <div className="clockit-hero-primary-foot">
                <button
                  className="clockit-hero-open-btn"
                  type="button"
                  onClick={() => handleOpenEdit(nextTask)}
                >
                  <span>Open task</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div className="clockit-hero-primary">
              <div className="clockit-hero-primary-head">
                <span className="clockit-hero-eyebrow">All caught up</span>
              </div>
              <h2 className="clockit-hero-primary-title">No pending tasks</h2>
              <div className="clockit-hero-primary-meta">
                <span>Great job — you have cleared all prioritized tasks.</span>
              </div>
              <div className="clockit-hero-primary-foot">
                <button className="clockit-hero-open-btn" type="button" onClick={onNavigateToTasks}>
                  <span>Go to Tasks</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          <div className="clockit-hero-focus-block">
            <div>
              <h2 className="clockit-focus-title">Let's focus</h2>
              <p className="clockit-focus-sub">
                {nextTask ? `Ready to work on "${nextTask.title}"?` : 'Ready to start a deep focus block?'}
              </p>
            </div>
            <div>
              <button className="clockit-focus-btn" onClick={handleStartFocusNextTask} type="button">
                <Play size={15} fill="currentColor" />
                <span>Start Focus</span>
              </button>
              <p className="clockit-focus-est">
                Estimate: {nextTask?.estimate || '45 mins'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 1b. Today at a glance — real counts that answer the first-screen questions */}
      <section className="clockit-home-snapshot" aria-label="Today at a glance">
        <button
          type="button"
          className="clockit-snapshot-card"
          onClick={() => {
            setActiveFilter('overdue');
            setSelectedCalendarDate(null);
          }}
          title="Show overdue tasks"
        >
          <span className="clockit-snapshot-icon" data-tone="alert">
            <AlertCircle size={16} />
          </span>
          <span className="clockit-snapshot-body">
            <span className="clockit-snapshot-value">{overdueTasks.length}</span>
            <span className="clockit-snapshot-label">Overdue</span>
          </span>
        </button>

        <button
          type="button"
          className="clockit-snapshot-card"
          onClick={() => {
            setActiveFilter('today');
            setSelectedCalendarDate(null);
          }}
          title="Show today's tasks"
        >
          <span className="clockit-snapshot-icon" data-tone="today">
            <CalendarIcon size={16} />
          </span>
          <span className="clockit-snapshot-body">
            <span className="clockit-snapshot-value">
              {todayCompletedCount}
              <span className="clockit-snapshot-of">/{todayTasks.length}</span>
            </span>
            <span className="clockit-snapshot-label">Done today</span>
          </span>
        </button>

        <button
          type="button"
          className="clockit-snapshot-card"
          onClick={() => {
            setActiveFilter('upcoming');
            setSelectedCalendarDate(null);
          }}
          title="Show upcoming tasks"
        >
          <span className="clockit-snapshot-icon" data-tone="upcoming">
            <CalendarClock size={16} />
          </span>
          <span className="clockit-snapshot-body">
            <span className="clockit-snapshot-value">{upcomingTasks.length}</span>
            <span className="clockit-snapshot-label">Upcoming</span>
          </span>
        </button>

        <button
          type="button"
          className="clockit-snapshot-card"
          onClick={onNavigateToFocus}
          title="Open the focus timer"
        >
          <span className="clockit-snapshot-icon" data-tone="focus">
            <Clock size={16} />
          </span>
          <span className="clockit-snapshot-body">
            <span className="clockit-snapshot-value">{focusStats.timeFocused}</span>
            <span className="clockit-snapshot-label">Focused</span>
          </span>
        </button>
      </section>

      {/* 2. Main 2-Column Content Grid */}
      <div className="clockit-home-columns">
        {/* Left Column: Task Overview Table (STEP 2) */}
        <section className="clockit-tasks-card" aria-label="Task List">
          {/* Card header — section identity, live count, and a route into Tasks */}
          <div className="clockit-tasks-card-head">
            <div>
              <h2 className="clockit-tasks-card-title">Tasks</h2>
              <p className="clockit-tasks-card-sub">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} shown
              </p>
            </div>
            {onNavigateToTasks && (
              <button type="button" className="clockit-text-btn" onClick={onNavigateToTasks}>
                View all
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          {/* Filter Bar */}
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
                  <span>{monthNames[calendarMonth].slice(0, 3)} {selectedCalendarDate}</span>
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="clockit-tasks-sort">
              <span>Sort by</span>
              <select
                className="clockit-sort-select"
                aria-label="Sort tasks"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="deadline">Deadline (Nearest)</option>
                <option value="priority">Priority (Highest)</option>
                <option value="workspace">Workspace</option>
              </select>

              {onNavigateToTasks && (
                <button
                  className="clockit-icon-action-btn"
                  aria-label="View all tasks"
                  title="Open Tasks Page"
                  type="button"
                  onClick={onNavigateToTasks}
                >
                  <SlidersHorizontal size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Task Rows List */}
          <div className="clockit-tasks-list">
            {filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
                <AlertCircle size={22} style={{ display: 'block', margin: '0 auto 6px', opacity: 0.5 }} />
                <span>No tasks match this filter.</span>
              </div>
            ) : (
              filteredTasks.map((task) => (
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
                      title={task.completed ? 'Reopen task' : 'Mark complete'}
                    >
                      {task.completed && '✓'}
                    </div>
                    <span
                      className={`clockit-task-title ${task.completed ? 'completed' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleOpenEdit(task)}
                      title="Click to view/edit details"
                    >
                      {task.title}
                    </span>
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

                    {/* Deadline with Overdue indicator */}
                    <span className={`clockit-task-deadline ${task.isOverdue && !task.completed ? 'overdue' : ''}`}>
                      <CalendarIcon size={13} color={task.isOverdue && !task.completed ? '#ef4444' : 'var(--text-muted)'} />
                      <span>
                        {task.deadline} {task.daysLeft ? `(${task.daysLeft})` : ''}
                      </span>
                    </span>

                    {/* Priority Badge */}
                    <span className={`clockit-priority-badge ${task.priority}`}>
                      {task.priority}
                    </span>

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

                    {/* Dropdown Menu */}
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
                          onClick={() => handleOpenEdit(task)}
                        >
                          <Edit2 size={13} />
                          <span>Edit Task</span>
                        </button>

                        <button
                          type="button"
                          className="clockit-nav-item"
                          style={{ padding: '6px 8px', fontSize: 12, justifyContent: 'flex-start' }}
                          onClick={() => handleFocusTask(task)}
                        >
                          <Crosshair size={13} color="var(--accent-mint)" />
                          <span>Focus in Timer</span>
                        </button>

                        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

                        {task.status !== 'completed' ? (
                          <button
                            type="button"
                            className="clockit-nav-item"
                            style={{ padding: '6px 8px', fontSize: 12, justifyContent: 'flex-start' }}
                            onClick={() => handleSetStatus(task.id, 'completed')}
                          >
                            <CheckCircle2 size={13} color="#22c55e" />
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
        </section>

        {/* Right Column: Widgets */}
        <aside className="clockit-widgets-column" aria-label="Sidebar Widgets">
          {/* Widget 1: Interactive Mini Calendar (STEP 5) */}
          <div className="clockit-widget-card" data-widget="calendar">
            <div className="clockit-widget-header">
              <span
                className="clockit-widget-title"
                style={{ cursor: onNavigateToCalendar ? 'pointer' : 'default' }}
                onClick={onNavigateToCalendar}
                title={onNavigateToCalendar ? 'Open Calendar' : undefined}
              >
                {monthNames[calendarMonth]} {calendarYear}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="clockit-icon-action-btn"
                  style={{ padding: 2 }}
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Previous Month"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  className="clockit-icon-action-btn"
                  style={{ padding: 2 }}
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Next Month"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            <div className="clockit-calendar-grid">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className="clockit-calendar-day-header">{day}</div>
              ))}
              {calendarDays.map((date, idx) => {
                const isEmpty = date === null;
                const hasTask = date !== null && taskDaysInMonth.has(date);
                const isAnchorToday = date !== null && calendarYear === 2026 && calendarMonth === 9 && date === 26;
                const isSelected = date !== null && selectedCalendarDate === date;

                return (
                  <div
                    key={idx}
                    className={`clockit-calendar-day${isEmpty ? ' is-empty' : ''}${isAnchorToday ? ' active' : ''}${isSelected ? ' is-selected' : ''}${hasTask ? ' has-task' : ''}`}
                    aria-hidden={isEmpty || undefined}
                    onClick={() => {
                      if (date === null) return;
                      setSelectedCalendarDate(selectedCalendarDate === date ? null : date);
                    }}
                    title={hasTask ? `Tasks due on ${monthNames[calendarMonth]} ${date}` : undefined}
                  >
                    {isEmpty ? '' : date}
                  </div>
                );
              })}
            </div>

            {selectedCalendarDate !== null && (
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <button
                  type="button"
                  className="clockit-filter-pill"
                  style={{ fontSize: 11, padding: '2px 8px' }}
                  onClick={() => setSelectedCalendarDate(null)}
                >
                  Clear filter ({monthNames[calendarMonth].slice(0, 3)} {selectedCalendarDate})
                </button>
              </div>
            )}
          </div>

          {/* Widget 2: Today Tasks (STEP 5) */}
          <div className="clockit-widget-card" data-widget="today">
            <div className="clockit-widget-header">
              <span className="clockit-widget-title">Today</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {todayCompletedCount} / {todayTasks.length} done
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {todayTasks.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '10px 0', textAlign: 'center' }}>
                  No tasks due today.
                </div>
              ) : (
                todayTasks.map((item) => (
                  <div
                    key={item.id}
                    className="clockit-today-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleToggleTask(item.id)}
                    title={item.completed ? 'Reopen task' : 'Mark as completed'}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: item.categoryColor || '#22c55e',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 12.5,
                        textDecoration: item.completed ? 'line-through' : 'none',
                        color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      }}
                    >
                      {item.title}
                    </span>
                    {item.completed && <CheckCircle2 size={13} color="var(--accent-mint)" />}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddTodayTask} className="clockit-quick-add-row" style={{ marginTop: 8 }}>
              <Plus size={15} color="var(--text-muted)" />
              <input
                type="text"
                className="clockit-quick-add-input"
                placeholder="Add quick task"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                aria-label="Add quick task"
              />
            </form>
          </div>

          {/* Widget 3: Real Focus Stats (STEP 4) */}
          <div className="clockit-widget-card" data-widget="focus-stats">
            <div className="clockit-widget-header">
              <span
                className="clockit-widget-title"
                style={{ cursor: onNavigateToFocus ? 'pointer' : 'default' }}
                onClick={onNavigateToFocus}
                title={onNavigateToFocus ? 'Open Focus Timer' : undefined}
              >
                Focus Stats
              </span>
              <select
                className="clockit-sort-select"
                style={{ fontSize: 11 }}
                value={focusTimeRange}
                onChange={(e) => setFocusTimeRange(e.target.value as any)}
                aria-label="Focus stats timeframe"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
              </select>
            </div>

            <div
              className="clockit-focus-stats-body"
              style={{ cursor: onNavigateToFocus ? 'pointer' : 'default' }}
              onClick={onNavigateToFocus}
              title="Click to start a focus session"
            >
              {/* Circular SVG Donut Progress */}
              <div className="clockit-focus-donut-wrap">
                <svg width="86" height="86" viewBox="0 0 86 86">
                  <circle
                    cx="43"
                    cy="43"
                    r="34"
                    fill="none"
                    stroke="var(--bg-surface-subtle)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="43"
                    cy="43"
                    r="34"
                    fill="none"
                    stroke="var(--accent-green)"
                    strokeWidth="8"
                    strokeDasharray={donutCircumference}
                    strokeDashoffset={donutOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 43 43)"
                    style={{ transition: 'stroke-dashoffset 600ms var(--motion-ease-out)' }}
                  />
                </svg>
                <div className="clockit-focus-donut-text">
                  <div>{focusStats.timeFocused}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 500 }}>Focused</div>
                </div>
              </div>

              {/* Side Stats Meta */}
              <div className="clockit-focus-stats-meta" style={{ flex: 1 }}>
                <div className="clockit-focus-stat-row">
                  <span>Sessions</span>
                  <strong>{focusStats.sessions}</strong>
                </div>
                <div className="clockit-focus-stat-row">
                  <span>Deep work</span>
                  <strong>{focusStats.deepWork}</strong>
                </div>
                <div className="clockit-focus-stat-row">
                  <span>Light work</span>
                  <strong>{focusStats.lightWork}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 4: Quick Notes (STEP 6) */}
          <QuickNotesCard maxVisibleNotes={4} />
        </aside>
      </div>

      {/* MODAL 1: Edit Task Modal */}
      {isEditModalOpen && editingTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="clockit-card"
            role="dialog"
            aria-modal="true"
            aria-label="Edit task details"
            style={{ width: 480, maxWidth: '92%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, margin: 0, color: 'var(--text-primary)' }}>Edit Task Details</h2>
              <button
                type="button"
                className="clockit-icon-action-btn"
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>Title *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="clockit-quick-add-input"
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="clockit-quick-add-input"
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 70, resize: 'vertical', paddingTop: 8, fontFamily: 'inherit' }}
                />
              </div>

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
                  <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>Estimate</label>
                  <input
                    type="text"
                    value={formEstimate}
                    onChange={(e) => setFormEstimate(e.target.value)}
                    className="clockit-quick-add-input"
                    style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                  />
                </div>
              </div>

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
                  <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>Due Time</label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="clockit-quick-add-input"
                    style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>Tags</label>
                <input
                  type="text"
                  placeholder="#tag1, #tag2"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="clockit-quick-add-input"
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <button
                  type="button"
                  className="clockit-filter-pill"
                  style={{ color: '#ef4444' }}
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setTaskToDelete(editingTask);
                  }}
                >
                  <Trash2 size={13} color="#ef4444" style={{ marginRight: 4 }} />
                  Delete
                </button>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="clockit-filter-pill"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="clockit-primary-btn">
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Confirmation Modal */}
      {taskToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setTaskToDelete(null)}
        >
          <div
            className="clockit-card"
            role="dialog"
            aria-modal="true"
            aria-label="Delete task confirmation"
            style={{ width: 400, maxWidth: '90%' }}
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
