import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Check,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  X,
  Tag,
  CircleCheckBig,
} from 'lucide-react';
import { dataService, ANCHOR_DATE, WORKSPACE_COLORS } from '../../services/dataService';
import { TaskItem, TaskPriority, TaskStatus, CalendarEvent, TimelineEvent } from '../../data/mockData';

// Safe Local Date Helpers (avoid UTC timezone shift bugs)
const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d, 0, 0, 0, 0);
  }
  return new Date();
};

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Convert time string (e.g., "10:00 AM", "2:00 PM") to minutes from midnight for sorting
const timeStringToMinutes = (timeStr?: string): number => {
  if (!timeStr) return 9999;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 9999;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3]?.toUpperCase();

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

interface MonthCell {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isPrevMonth: boolean;
  isNextMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export const CalendarPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day' | 'Agenda'>('Month');
  
  // Navigation & Date selection state
  const [currentDate, setCurrentDate] = useState<Date>(() => parseLocalDate(ANCHOR_DATE));
  const [selectedDate, setSelectedDate] = useState<string>(ANCHOR_DATE);
  const [miniCalDate, setMiniCalDate] = useState<Date>(() => new Date(2026, 9, 1));

  // Calendar filter toggles
  const [visibleCalendars, setVisibleCalendars] = useState<Record<string, boolean>>({
    Personal: true,
    College: true,
    Development: true,
    Freelance: true,
    Habits: true,
    Club: true,
  });

  // Task & Event data from single source of truth
  const [tasks, setTasks] = useState<TaskItem[]>(() => dataService.getTasks());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => dataService.getCalendarEvents());
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(() => dataService.getTimelineEvents());

  // Subscribe to real-time data changes across pages
  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setTasks(dataService.getTasks());
      setCalendarEvents(dataService.getCalendarEvents());
      setTimelineEvents(dataService.getTimelineEvents());
    });
    return unsubscribe;
  }, []);

  // Modal State (Create & Edit Task)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('Medium');
  const [formStatus, setFormStatus] = useState<TaskStatus>('todo');
  const [formWorkspace, setFormWorkspace] = useState('Personal');
  const [formDueDate, setFormDueDate] = useState(selectedDate);
  const [formDueTime, setFormDueTime] = useState('10:00 AM');
  const [formEstimate, setFormEstimate] = useState('1–2 hrs');
  const [formTags, setFormTags] = useState('');
  const [formError, setFormError] = useState('');

  // Delete Confirmation Modal
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

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

  // Toggle calendar filter checkbox
  const toggleCalendarFilter = (key: string) => {
    setVisibleCalendars((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isWorkspaceVisible = (workspace?: string): boolean => {
    if (!workspace) return true;
    return visibleCalendars[workspace] !== false;
  };

  // Open Create Task Modal
  const handleOpenCreateModal = (defaultDate?: string, defaultTime?: string) => {
    setModalMode('create');
    setEditingTaskId(null);
    setFormTitle('');
    setFormDescription('');
    setFormPriority('Medium');
    setFormStatus('todo');
    setFormWorkspace('Personal');
    setFormDueDate(defaultDate || selectedDate);
    setFormDueTime(defaultTime || '10:00 AM');
    setFormEstimate('1–2 hrs');
    setFormTags('');
    setFormError('');
    setIsTaskModalOpen(true);
  };

  // Open Edit Task Modal
  const handleOpenEditModal = (task: TaskItem) => {
    setModalMode('edit');
    setEditingTaskId(task.id);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormWorkspace(task.workspace);
    setFormDueDate(task.dueDate || selectedDate);
    setFormDueTime(task.dueTime || '');
    setFormEstimate(task.estimate || '1–2 hrs');
    setFormTags(task.tags ? task.tags.join(', ') : '');
    setFormError('');
    setIsTaskModalOpen(true);
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

  // Confirm delete task
  const handleConfirmDelete = () => {
    if (taskToDelete) {
      dataService.deleteTask(taskToDelete.id);
      setTaskToDelete(null);
      if (editingTaskId === taskToDelete.id) {
        setIsTaskModalOpen(false);
      }
    }
  };

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'Month') {
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      setCurrentDate(prevMonth);
      setMiniCalDate(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1));
    } else if (viewMode === 'Week') {
      const prevWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    } else if (viewMode === 'Day') {
      const prevDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1);
      setCurrentDate(prevDay);
      setSelectedDate(formatLocalDate(prevDay));
    } else {
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      setCurrentDate(prevMonth);
    }
  };

  const handleNext = () => {
    if (viewMode === 'Month') {
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      setCurrentDate(nextMonth);
      setMiniCalDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
    } else if (viewMode === 'Week') {
      const nextWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    } else if (viewMode === 'Day') {
      const nextDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
      setCurrentDate(nextDay);
      setSelectedDate(formatLocalDate(nextDay));
    } else {
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      setCurrentDate(nextMonth);
    }
  };

  const handleToday = () => {
    const today = parseLocalDate(ANCHOR_DATE);
    setCurrentDate(today);
    setSelectedDate(ANCHOR_DATE);
    setMiniCalDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Mini Calendar Navigation
  const handleMiniCalPrev = () => {
    setMiniCalDate(new Date(miniCalDate.getFullYear(), miniCalDate.getMonth() - 1, 1));
  };

  const handleMiniCalNext = () => {
    setMiniCalDate(new Date(miniCalDate.getFullYear(), miniCalDate.getMonth() + 1, 1));
  };

  // Generate Month Grid Weeks dynamically (supports leap years & any start day)
  const monthWeeks = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay(); // 0 is Sun, 1 is Mon...
    const startingDayOffset = (firstWeekday + 6) % 7; // 0 if Mon, 6 if Sun

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: MonthCell[] = [];

    // Trailing days from previous month
    for (let i = startingDayOffset - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const d = new Date(year, month - 1, day, 0, 0, 0, 0);
      const dateStr = formatLocalDate(d);
      cells.push({
        date: d,
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isPrevMonth: true,
        isNextMonth: false,
        isToday: dateStr === ANCHOR_DATE,
        isSelected: dateStr === selectedDate,
      });
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day, 0, 0, 0, 0);
      const dateStr = formatLocalDate(d);
      cells.push({
        date: d,
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isPrevMonth: false,
        isNextMonth: false,
        isToday: dateStr === ANCHOR_DATE,
        isSelected: dateStr === selectedDate,
      });
    }

    // Leading days of next month to complete standard grid (35 or 42 cells)
    const remainder = cells.length % 7;
    const daysNeeded = remainder === 0 ? (cells.length < 35 ? 35 - cells.length : 0) : 7 - remainder;
    for (let day = 1; day <= daysNeeded; day++) {
      const d = new Date(year, month + 1, day, 0, 0, 0, 0);
      const dateStr = formatLocalDate(d);
      cells.push({
        date: d,
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isPrevMonth: false,
        isNextMonth: true,
        isToday: dateStr === ANCHOR_DATE,
        isSelected: dateStr === selectedDate,
      });
    }

    // Split into weeks of 7 days
    const weeks: MonthCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [currentDate, selectedDate]);

  // Generate Week Days (Mon - Sun)
  const weekDays = useMemo(() => {
    const dayOfWeek = (currentDate.getDay() + 6) % 7;
    const monday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - dayOfWeek, 0, 0, 0, 0);

    const days: MonthCell[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 0, 0, 0, 0);
      const dateStr = formatLocalDate(d);
      days.push({
        date: d,
        dateStr,
        dayNumber: d.getDate(),
        isCurrentMonth: d.getMonth() === currentDate.getMonth(),
        isPrevMonth: d.getMonth() < currentDate.getMonth(),
        isNextMonth: d.getMonth() > currentDate.getMonth(),
        isToday: dateStr === ANCHOR_DATE,
        isSelected: dateStr === selectedDate,
      });
    }
    return days;
  }, [currentDate, selectedDate]);

  // Generate Mini Calendar Days
  const miniCalGrid = useMemo(() => {
    const year = miniCalDate.getFullYear();
    const month = miniCalDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startingDayOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{ day: number | null; dateStr: string | null; isToday: boolean; isSelected: boolean; hasTask: boolean }> = [];
    for (let i = 0; i < startingDayOffset; i++) {
      days.push({ day: null, dateStr: null, isToday: false, isSelected: false, hasTask: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasTask = tasks.some((t) => t.dueDate === dateStr && isWorkspaceVisible(t.workspace));
      days.push({
        day: d,
        dateStr,
        isToday: dateStr === ANCHOR_DATE,
        isSelected: dateStr === selectedDate,
        hasTask,
      });
    }
    while (days.length % 7 !== 0) {
      days.push({ day: null, dateStr: null, isToday: false, isSelected: false, hasTask: false });
    }
    return days;
  }, [miniCalDate, selectedDate, tasks, visibleCalendars]);

  // Header Title String based on View Mode
  const navigationTitle = useMemo(() => {
    if (viewMode === 'Month') {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (viewMode === 'Week') {
      const start = weekDays[0].date;
      const end = weekDays[6].date;
      const startM = MONTH_SHORT[start.getMonth()];
      const endM = MONTH_SHORT[end.getMonth()];
      if (start.getFullYear() === end.getFullYear()) {
        if (start.getMonth() === end.getMonth()) {
          return `${startM} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
        }
        return `${startM} ${start.getDate()} – ${endM} ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${startM} ${start.getDate()}, ${start.getFullYear()} – ${endM} ${end.getDate()}, ${end.getFullYear()}`;
    }
    if (viewMode === 'Day') {
      const sel = parseLocalDate(selectedDate);
      return `${WEEKDAYS_FULL[sel.getDay()]}, ${sel.getDate()} ${MONTH_NAMES[sel.getMonth()]} ${sel.getFullYear()}`;
    }
    return `Upcoming Agenda · ${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [viewMode, currentDate, selectedDate, weekDays]);

  // Unified items for a specific date cell
  const getItemsForDate = (dateStr: string, dayNumber: number, isCurrentMonth: boolean) => {
    // 1. Real tasks matching dueDate
    const matchingTasks = tasks.filter((t) => {
      if (!t.dueDate) return false;
      return t.dueDate === dateStr && isWorkspaceVisible(t.workspace);
    });

    // 2. If viewing October 2026, include calendarEvents if not duplicate
    const year = parseLocalDate(dateStr).getFullYear();
    const month = parseLocalDate(dateStr).getMonth();
    const additionalEvents: CalendarEvent[] = [];

    if (year === 2026 && month === 9 && isCurrentMonth) {
      calendarEvents.forEach((ce) => {
        if (ce.day === dayNumber && isWorkspaceVisible(ce.workspace)) {
          const alreadyCovered = matchingTasks.some(
            (t) => t.title.toLowerCase().trim() === ce.title.toLowerCase().trim()
          );
          if (!alreadyCovered) {
            additionalEvents.push(ce);
          }
        }
      });
    }

    return { tasks: matchingTasks, events: additionalEvents };
  };

  // Selected Date Timeline Items (Column 3)
  const timelineData = useMemo(() => {
    const selDateObj = parseLocalDate(selectedDate);
    const isAnchorDate = selectedDate === ANCHOR_DATE;

    // Filter tasks due on selectedDate
    const dateTasks = tasks.filter((t) => {
      if (!t.dueDate) return false;
      return t.dueDate === selectedDate && isWorkspaceVisible(t.workspace);
    });

    // Separate tasks with scheduled times from untimed tasks
    const timedTasks = dateTasks
      .filter((t) => Boolean(t.dueTime))
      .sort((a, b) => timeStringToMinutes(a.dueTime) - timeStringToMinutes(b.dueTime));

    const untimedTasks = dateTasks.filter((t) => !t.dueTime);

    type UnifiedTimelineItem = {
      id: string;
      time: string;
      title: string;
      subtitle: string;
      color: string;
      task?: TaskItem;
      isEvent: boolean;
    };

    // Scheduled events for the selected day. The mock routine timeline belongs
    // to the anchor day; month events apply to any date in the same month.
    const eventItems: UnifiedTimelineItem[] = [];

    if (isAnchorDate) {
      timelineEvents.forEach((ev) => {
        const covered = dateTasks.some((t) => t.title.toLowerCase().includes(ev.title.toLowerCase()));
        if (!covered) {
          eventItems.push({
            id: ev.id,
            time: ev.time,
            title: ev.title,
            subtitle: ev.subtitle,
            color: ev.color,
            isEvent: true,
          });
        }
      });
    }

    const selMonth = selDateObj.getMonth();
    const selDayNumber = selDateObj.getDate();
    if (selDateObj.getFullYear() === 2026 && selMonth === 9) {
      calendarEvents.forEach((ce) => {
        if (ce.day !== selDayNumber || !isWorkspaceVisible(ce.workspace)) return;
        const alreadyCovered =
          dateTasks.some((t) => t.title.toLowerCase().trim() === ce.title.toLowerCase().trim()) ||
          eventItems.some((e) => e.title.toLowerCase().trim() === ce.title.toLowerCase().trim());
        if (!alreadyCovered) {
          eventItems.push({
            id: `cal-${ce.id}`,
            time: ce.time,
            title: ce.title,
            subtitle: `${ce.workspace} · Event`,
            color: ce.color,
            isEvent: true,
          });
        }
      });
    }

    // Merge timed items and sort chronologically
    const unifiedTimed: UnifiedTimelineItem[] = [
      ...timedTasks.map((t) => ({
        id: t.id,
        time: t.dueTime || '',
        title: t.title,
        subtitle: `${t.workspace} · ${t.priority}${t.estimate ? ` · ${t.estimate}` : ''}${t.completed ? ' · Completed' : ''}`,
        color: t.categoryColor || WORKSPACE_COLORS[t.workspace] || '#22c55e',
        task: t,
        isEvent: false,
      })),
      ...eventItems,
    ].sort((a, b) => timeStringToMinutes(a.time) - timeStringToMinutes(b.time));

    const formattedDateTitle = isAnchorDate
      ? 'Today'
      : WEEKDAYS_FULL[selDateObj.getDay()];

    const formattedDateSubtitle = `${WEEKDAYS_SHORT[(selDateObj.getDay() + 6) % 7]}, ${selDateObj.getDate()} ${MONTH_SHORT[selDateObj.getMonth()]} ${selDateObj.getFullYear()}`;

    return {
      title: formattedDateTitle,
      subtitle: formattedDateSubtitle,
      timedItems: unifiedTimed,
      untimedTasks,
      totalCount: unifiedTimed.length + untimedTasks.length,
    };
  }, [selectedDate, tasks, timelineEvents, calendarEvents, visibleCalendars]);

  // Tasks grouped for Agenda View
  const agendaGroups = useMemo(() => {
    const tasksWithDeadline = tasks.filter((t) => Boolean(t.dueDate) && isWorkspaceVisible(t.workspace));

    // Sort all by dueDate and dueTime
    const sorted = [...tasksWithDeadline].sort((a, b) => {
      if (a.dueDate! !== b.dueDate!) {
        return a.dueDate!.localeCompare(b.dueDate!);
      }
      return timeStringToMinutes(a.dueTime) - timeStringToMinutes(b.dueTime);
    });

    const overdueList = sorted.filter((t) => t.isOverdue && !t.completed);
    const nonOverdue = sorted.filter((t) => !t.isOverdue || t.completed);

    // Group nonOverdue by date
    const groups: Record<string, TaskItem[]> = {};
    nonOverdue.forEach((t) => {
      const dateKey = t.dueDate!;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });

    return {
      overdueList,
      dateGroups: Object.entries(groups).map(([dateStr, items]) => {
        const d = parseLocalDate(dateStr);
        const isToday = dateStr === ANCHOR_DATE;
        let label = `${WEEKDAYS_SHORT[(d.getDay() + 6) % 7]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
        if (isToday) label = `Today · ${label}`;
        return {
          dateStr,
          dateObj: d,
          label,
          items,
        };
      }),
    };
  }, [tasks, visibleCalendars]);

  return (
    <div className="clockit-page-container">
      {/* 1. Header Row */}
      <div className="clockit-page-header-row">
        <div>
          <h1 className="clockit-page-title">Calendar</h1>
          <p className="clockit-page-subtitle">Plan your time. Keep everything in sync.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* View Mode Switchers */}
          <div className="clockit-filter-pills" role="tablist">
            {(['Month', 'Week', 'Day', 'Agenda'] as const).map((mode) => (
              <button
                key={mode}
                className={`clockit-filter-pill ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode)}
                role="tab"
                aria-selected={viewMode === mode}
                type="button"
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            className="clockit-primary-btn"
            onClick={() => handleOpenCreateModal()}
            type="button"
          >
            <Plus size={15} />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* 2. Month / Period Selector Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="clockit-icon-action-btn"
            style={{ padding: 4 }}
            onClick={handlePrev}
            aria-label="Previous period"
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="clockit-icon-action-btn"
            style={{ padding: 4 }}
            onClick={handleNext}
            aria-label="Next period"
            type="button"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          className="clockit-filter-pill"
          onClick={handleToday}
          style={{ padding: '4px 12px', fontSize: 12.5 }}
          type="button"
        >
          Today
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
          {navigationTitle}
        </span>
      </div>

      {/* 3. Main Calendar 3-Column Split */}
      <div className="clockit-calendar-main-grid">
        {/* Column 1: Main View Area (Month / Week / Day / Agenda) */}
        <div className="clockit-cal-view" key={viewMode} style={{ minWidth: 0, overflowX: 'auto', width: '100%' }}>
          {/* MONTH VIEW */}
          {viewMode === 'Month' && (
            <table className="clockit-month-calendar-table">
              <thead>
                <tr>
                  {WEEKDAYS_SHORT.map((day) => (
                    <th key={day}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthWeeks.map((week, wIdx) => (
                  <tr key={wIdx}>
                    {week.map((cell, dIdx) => {
                      const { tasks: dayTasks, events: dayEvents } = getItemsForDate(
                        cell.dateStr,
                        cell.dayNumber,
                        cell.isCurrentMonth
                      );
                      const isActive = cell.isSelected;
                      const isToday = cell.isToday;

                      return (
                        <td
                          key={dIdx}
                          className={isActive ? 'clockit-cal-cell-active' : ''}
                          onClick={() => {
                            setSelectedDate(cell.dateStr);
                          }}
                          onDoubleClick={() => handleOpenCreateModal(cell.dateStr)}
                          style={{
                            opacity: cell.isCurrentMonth ? 1 : 0.38,
                            cursor: 'pointer',
                          }}
                        >
                          <span className={`clockit-cal-daynum${isToday ? ' is-today' : ''}`}>
                            {cell.dayNumber}
                          </span>

                          {/* Compact task & event indicators */}
                          <div className="clockit-cal-cell-items">
                            {dayTasks.slice(0, 3).map((task) => {
                              const color = task.categoryColor || WORKSPACE_COLORS[task.workspace] || '#22c55e';
                              return (
                                <button
                                  key={task.id}
                                  type="button"
                                  className={`clockit-cal-mini-item${task.completed ? ' is-done' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDate(cell.dateStr);
                                    handleOpenEditModal(task);
                                  }}
                                  title={`${task.title}${task.dueTime ? ` · ${task.dueTime}` : ''} · ${task.priority}${task.completed ? ' · Completed' : ''}`}
                                >
                                  <span className="clockit-cal-mini-dot" style={{ backgroundColor: color }} />
                                  <span className="clockit-cal-mini-title">{task.title}</span>
                                </button>
                              );
                            })}

                            {dayEvents.slice(0, Math.max(0, 3 - dayTasks.length)).map((ev) => (
                              <button
                                key={ev.id}
                                type="button"
                                className="clockit-cal-mini-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDate(cell.dateStr);
                                  handleOpenCreateModal(cell.dateStr, ev.time);
                                }}
                                title={`${ev.title} · ${ev.time}`}
                              >
                                <span className="clockit-cal-mini-dot" style={{ backgroundColor: ev.color }} />
                                <span className="clockit-cal-mini-title">{ev.title}</span>
                              </button>
                            ))}

                            {dayTasks.length + dayEvents.length > 3 && (
                              <span className="clockit-cal-mini-more">
                                +{dayTasks.length + dayEvents.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* WEEK VIEW */}
          {viewMode === 'Week' && (
            <div className="clockit-cal-week-grid">
              {weekDays.map((day, idx) => {
                const { tasks: dayTasks } = getItemsForDate(day.dateStr, day.dayNumber, true);
                const isActive = day.isSelected;
                const isToday = day.isToday;

                return (
                  <div
                    key={idx}
                    className={`clockit-cal-week-col ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedDate(day.dateStr)}
                  >
                    <div
                      className="clockit-cal-week-header"
                      style={{
                        color: isActive || isToday ? 'var(--accent-mint)' : 'var(--text-primary)',
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        {WEEKDAYS_SHORT[idx]}
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>
                        {day.dayNumber}
                      </span>
                      {isToday && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent-mint)' }}>Today</span>
                      )}
                    </div>

                    {/* Week Column Tasks */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      {dayTasks.map((task) => {
                        const color = task.categoryColor || WORKSPACE_COLORS[task.workspace] || '#22c55e';
                        return (
                          <div
                            key={task.id}
                            className="clockit-cal-event-chip"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(day.dateStr);
                              handleOpenEditModal(task);
                            }}
                            style={{
                              color: 'var(--text-primary)',
                              borderLeft: `2.5px solid ${color}`,
                              padding: '5px 8px',
                              opacity: task.completed ? 0.68 : 1,
                              textDecoration: task.completed ? 'line-through' : 'none',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                              <span style={{ fontWeight: 600, fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {task.title}
                              </span>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                                <span>{task.dueTime || 'All Day'}</span>
                                <span style={{ fontWeight: 600 }}>{task.workspace}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {dayTasks.length === 0 && (
                        <div
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            fontSize: 11,
                            opacity: 0.5,
                          }}
                        >
                          No tasks
                        </div>
                      )}
                    </div>

                    <button
                      className="clockit-icon-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreateModal(day.dateStr);
                      }}
                      style={{
                        width: '100%',
                        marginTop: 8,
                        padding: '4px 0',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        justifyContent: 'center',
                        borderRadius: 4,
                        border: '1px dashed var(--border-subtle)',
                      }}
                      type="button"
                    >
                      + Add
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* DAY VIEW */}
          {viewMode === 'Day' && (
            <div className="clockit-cal-day-view">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {WEEKDAYS_FULL[parseLocalDate(selectedDate).getDay()]}, {parseLocalDate(selectedDate).getDate()} {MONTH_NAMES[parseLocalDate(selectedDate).getMonth()]} {parseLocalDate(selectedDate).getFullYear()}
                  </h2>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {timelineData.totalCount} {timelineData.totalCount === 1 ? 'task / event' : 'tasks / events'} scheduled
                  </div>
                </div>
                <button
                  className="clockit-primary-btn"
                  onClick={() => handleOpenCreateModal(selectedDate)}
                  type="button"
                >
                  <Plus size={14} />
                  <span>Add Task for Day</span>
                </button>
              </div>

              {/* Unscheduled / All Day Section */}
              {timelineData.untimedTasks.length > 0 && (
                <div style={{ padding: '10px 14px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                    All Day / Unscheduled Tasks
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {timelineData.untimedTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleOpenEditModal(t)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'var(--bg-surface)',
                          borderRadius: 4,
                          borderLeft: `3px solid ${t.categoryColor || '#22c55e'}`,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.workspace} · {t.priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hourly Schedule Timeline Slots */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
                  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
                  '6:00 PM', '7:00 PM', '8:00 PM'
                ].map((hour) => {
                  const hourMinute = timeStringToMinutes(hour);
                  const matchingItems = timelineData.timedItems.filter((item) => {
                    const itemMinute = timeStringToMinutes(item.time);
                    return itemMinute >= hourMinute && itemMinute < hourMinute + 60;
                  });

                  return (
                    <div key={hour} className="clockit-cal-day-slot">
                      <span className="clockit-cal-day-time">{hour}</span>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {matchingItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => item.task && handleOpenEditModal(item.task)}
                            style={{
                              padding: '8px 12px',
                              background: 'var(--bg-surface-subtle)',
                              borderRadius: 'var(--radius-md)',
                              borderLeft: `3.5px solid ${item.color}`,
                              cursor: item.task ? 'pointer' : 'default',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>{item.subtitle}</div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: item.color }}>{item.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AGENDA VIEW */}
          {viewMode === 'Agenda' && (
            <div className="clockit-cal-agenda-view">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Agenda & Upcoming Tasks</h2>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Chronological schedule of tasks with deadlines
                  </div>
                </div>
                <button
                  className="clockit-primary-btn"
                  onClick={() => handleOpenCreateModal()}
                  type="button"
                >
                  <Plus size={14} />
                  <span>Add Task</span>
                </button>
              </div>

              {/* Overdue Section */}
              {agendaGroups.overdueList.length > 0 && (
                <div className="clockit-cal-agenda-group">
                  <div className="clockit-cal-agenda-header" style={{ color: '#ef4444' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertCircle size={15} />
                      <span>Overdue Tasks ({agendaGroups.overdueList.length})</span>
                    </div>
                  </div>
                  {agendaGroups.overdueList.map((task) => (
                    <div
                      key={task.id}
                      className="clockit-cal-agenda-item"
                      onClick={() => {
                        if (task.dueDate) setSelectedDate(task.dueDate);
                        handleOpenEditModal(task);
                      }}
                      style={{ borderLeft: '3.5px solid #ef4444' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{task.title}</span>
                        <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>
                          {task.daysLeft}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, color: 'var(--text-muted)' }}>
                        <span>{task.workspace}</span>
                        <span style={{ fontWeight: 600 }}>{task.deadline}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Date Groups */}
              {agendaGroups.dateGroups.map((group) => (
                <div key={group.dateStr} className="clockit-cal-agenda-group">
                  <button
                    type="button"
                    className="clockit-cal-agenda-header is-clickable"
                    onClick={() => setSelectedDate(group.dateStr)}
                    title="Show this day in the panel"
                  >
                    <span>{group.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
                      {group.items.length} {group.items.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </button>

                  {group.items.map((task) => {
                    const color = task.categoryColor || WORKSPACE_COLORS[task.workspace] || '#22c55e';
                    return (
                      <div
                        key={task.id}
                        className="clockit-cal-agenda-item"
                        onClick={() => {
                          if (task.dueDate) setSelectedDate(task.dueDate);
                          handleOpenEditModal(task);
                        }}
                        style={{
                          borderLeft: `3.5px solid ${color}`,
                          opacity: task.completed ? 0.6 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              dataService.toggleTask(task.id);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              color: task.completed ? 'var(--accent-mint)' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <CircleCheckBig size={16} />
                          </button>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              color: 'var(--text-primary)',
                              textDecoration: task.completed ? 'line-through' : 'none',
                            }}
                          >
                            {task.title}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, color: 'var(--text-muted)' }}>
                          {task.dueTime && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                              <Clock size={12} />
                              {task.dueTime}
                            </span>
                          )}
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                            {task.workspace}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{task.priority}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {agendaGroups.dateGroups.length === 0 && agendaGroups.overdueList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)', fontSize: 13 }}>
                  <CalendarIcon size={28} style={{ margin: '0 auto 10px', opacity: 0.4, display: 'block' }} />
                  No upcoming tasks match your active calendar filters.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Column 2: Mini Calendar + Calendars Filter List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Mini Calendar */}
          <div className="clockit-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12, fontWeight: 600 }}>
              <span style={{ color: 'var(--text-primary)' }}>
                {MONTH_NAMES[miniCalDate.getMonth()]} {miniCalDate.getFullYear()}
              </span>
              <div style={{ display: 'flex', gap: 2 }}>
                <button
                  className="clockit-icon-action-btn"
                  style={{ padding: 2 }}
                  onClick={handleMiniCalPrev}
                  type="button"
                  aria-label="Previous mini calendar month"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  className="clockit-icon-action-btn"
                  style={{ padding: 2 }}
                  onClick={handleMiniCalNext}
                  type="button"
                  aria-label="Next mini calendar month"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            <div className="clockit-calendar-grid" style={{ gap: 4 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className="clockit-calendar-day-header" style={{ fontSize: 9.5 }}>{day}</div>
              ))}
              {miniCalGrid.map((item, idx) => (
                <div
                  key={idx}
                  className={`clockit-calendar-day ${item.isSelected ? 'active' : ''} ${item.hasTask ? 'has-task' : ''}`}
                  onClick={() => {
                    if (item.dateStr) {
                      setSelectedDate(item.dateStr);
                      if (viewMode === 'Day') {
                        setCurrentDate(parseLocalDate(item.dateStr));
                      }
                    }
                  }}
                  style={{
                    height: 22,
                    fontSize: 11,
                    cursor: item.day ? 'pointer' : 'default',
                    opacity: item.day ? 1 : 0,
                  }}
                >
                  {item.day || ''}
                </div>
              ))}
            </div>
          </div>

          {/* Calendars Checklist */}
          <div className="clockit-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--text-primary)' }}>Calendars</span>
              <button className="clockit-icon-action-btn" style={{ padding: 2 }} type="button">
                <ChevronLeft size={13} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              {[
                { name: 'Personal', color: '#22c55e' },
                { name: 'College', color: '#3b82f6' },
                { name: 'Development', color: '#8b5cf6' },
                { name: 'Freelance', color: '#f97316' },
                { name: 'Habits', color: '#14b8a6' },
                { name: 'Club', color: '#a855f7' },
              ].map((cal) => {
                const isChecked = visibleCalendars[cal.name] !== false;
                return (
                  <div
                    key={cal.name}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    onClick={() => toggleCalendarFilter(cal.name)}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        backgroundColor: isChecked ? cal.color : 'transparent',
                        border: `1.5px solid ${cal.color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 10,
                      }}
                    >
                      {isChecked && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span style={{ color: 'var(--text-primary)' }}>{cal.name}</span>
                  </div>
                );
              })}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-muted)',
                  fontSize: 11.5,
                  marginTop: 4,
                  cursor: 'pointer',
                }}
                onClick={() => handleOpenCreateModal()}
              >
                <Plus size={13} />
                <span>Add calendar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Today's Timeline Panel */}
        <div className="clockit-card clockit-calendar-today-col" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{timelineData.title}</strong>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{timelineData.subtitle}</div>
            </div>
            <button
              className="clockit-icon-action-btn"
              onClick={() => handleOpenCreateModal(selectedDate)}
              style={{ border: '1px solid var(--border-subtle)', padding: 3 }}
              type="button"
              aria-label="Add event to selected day"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Selected-date information panel — re-fades whenever a new date is picked */}
          <div key={selectedDate} className="motion-fade-in clockit-day-panel">
            {timelineData.totalCount === 0 ? (
              <div className="clockit-day-panel-empty">
                <CalendarIcon size={22} />
                <span className="clockit-day-panel-empty-title">Nothing scheduled</span>
                <span className="clockit-day-panel-empty-sub">
                  No tasks or events on this day yet.
                </span>
                <button
                  type="button"
                  className="clockit-filter-pill"
                  onClick={() => handleOpenCreateModal(selectedDate)}
                >
                  <Plus size={13} />
                  <span>Add task</span>
                </button>
              </div>
            ) : (
              <div className="clockit-day-panel-list">
                {timelineData.timedItems.map((item) => {
                  const task = item.task;
                  const content = (
                    <>
                      <span className="clockit-day-panel-time">{item.time}</span>
                      <span className="clockit-day-panel-body">
                        <span className="clockit-day-panel-head">
                          <span className={`clockit-day-panel-title${task?.completed ? ' is-done' : ''}`}>
                            {item.title}
                          </span>
                          {item.isEvent ? (
                            <span className="clockit-day-panel-tag">Event</span>
                          ) : task ? (
                            <span className={`clockit-priority-badge ${task.priority}`}>{task.priority}</span>
                          ) : null}
                        </span>
                        <span className="clockit-day-panel-meta">
                          <span className="clockit-day-panel-ws">
                            <span className="clockit-day-panel-ws-dot" style={{ background: item.color }} />
                            {task ? task.workspace : item.subtitle}
                          </span>
                          {task ? (
                            <span className={`clockit-day-panel-status${task.completed ? ' is-done' : ''}`}>
                              {task.completed ? 'Completed' : 'Open'}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </>
                  );
                  // Tasks are real controls. Events are read-only information,
                  // so they must not render as a button that does nothing.
                  return task ? (
                    <button
                      key={item.id}
                      type="button"
                      className="clockit-day-panel-row"
                      onClick={() => handleOpenEditModal(task)}
                      title={`Open “${task.title}”`}
                    >
                      {content}
                    </button>
                  ) : (
                    <div key={item.id} className="clockit-day-panel-row is-static" title={item.title}>
                      {content}
                    </div>
                  );
                })}

                {timelineData.untimedTasks.map((t) => {
                  const color = t.categoryColor || WORKSPACE_COLORS[t.workspace] || '#22c55e';
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className="clockit-day-panel-row"
                      onClick={() => handleOpenEditModal(t)}
                      title={`Open “${t.title}”`}
                    >
                      <span className="clockit-day-panel-time is-allday">All day</span>
                      <span className="clockit-day-panel-body">
                        <span className="clockit-day-panel-head">
                          <span className={`clockit-day-panel-title${t.completed ? ' is-done' : ''}`}>
                            {t.title}
                          </span>
                          <span className={`clockit-priority-badge ${t.priority}`}>{t.priority}</span>
                        </span>
                        <span className="clockit-day-panel-meta">
                          <span className="clockit-day-panel-ws">
                            <span className="clockit-day-panel-ws-dot" style={{ background: color }} />
                            {t.workspace}
                          </span>
                          {t.deadline ? (
                            <span className="clockit-day-panel-deadline">{t.deadline}</span>
                          ) : null}
                          <span className={`clockit-day-panel-status${t.completed ? ' is-done' : ''}`}>
                            {t.completed ? 'Completed' : 'Open'}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            className="clockit-cal-add-btn"
            onClick={() => handleOpenCreateModal(selectedDate)}
            type="button"
          >
            <Plus size={13} />
            <span>Add event</span>
          </button>
        </div>
      </div>

      {/* Task Create / Edit Modal */}
      {isTaskModalOpen && (
        <div className="clockit-modal-scrim" onClick={() => setIsTaskModalOpen(false)}>
          <div
            className="clockit-card clockit-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label={modalMode === 'create' ? 'Add calendar event or task' : 'Edit task'}
            style={{ width: 440, padding: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {modalMode === 'create' ? 'Add Calendar Event / Task' : 'Edit Task'}
              </h2>
              <button
                className="clockit-icon-action-btn"
                onClick={() => setIsTaskModalOpen(false)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  borderRadius: 4,
                  fontSize: 12,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <AlertCircle size={14} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. PBL Final Report"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="clockit-quick-add-input"
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional details, notes, or agenda..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="clockit-quick-add-input"
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 60, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="clockit-quick-add-input"
                    style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Due Time (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="clockit-quick-add-input"
                    style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Calendar / Workspace</label>
                  <select
                    value={formWorkspace}
                    onChange={(e) => setFormWorkspace(e.target.value)}
                    className="clockit-sort-select"
                    style={{ width: '100%', height: 38, marginTop: 4 }}
                  >
                    <option value="Personal">Personal</option>
                    <option value="College">College</option>
                    <option value="Development">Development</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Habits">Habits</option>
                    <option value="Club">Club</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                    className="clockit-sort-select"
                    style={{ width: '100%', height: 38, marginTop: 4 }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                    className="clockit-sort-select"
                    style={{ width: '100%', height: 38, marginTop: 4 }}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Estimate</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 hr, 2–3 hrs"
                    value={formEstimate}
                    onChange={(e) => setFormEstimate(e.target.value)}
                    className="clockit-quick-add-input"
                    style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="#college, #report, #exam"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="clockit-quick-add-input"
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                {modalMode === 'edit' && editingTaskId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const t = tasks.find((item) => item.id === editingTaskId);
                      if (t) setTaskToDelete(t);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: 12.5,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="clockit-filter-pill"
                    onClick={() => setIsTaskModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="clockit-primary-btn">
                    {modalMode === 'create' ? 'Add Task' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="clockit-modal-scrim" onClick={() => setTaskToDelete(null)}>
          <div
            className="clockit-card clockit-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Delete task confirmation"
            style={{ width: 380, padding: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px', color: 'var(--text-primary)' }}>
              Delete Task?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 18px', lineHeight: 1.4 }}>
              Are you sure you want to delete <strong>"{taskToDelete.title}"</strong>? This action cannot be undone.
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
                onClick={handleConfirmDelete}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '7px 14px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
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
