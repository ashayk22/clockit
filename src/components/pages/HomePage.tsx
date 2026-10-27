import React, { useState } from 'react';
import {
  FileText,
  Calendar as CalendarIcon,
  Play,
  ChevronRight,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
  Home as HomeIcon,
  Send,
  Maximize2,
} from 'lucide-react';
import { TaskItem } from '../../data/mockData';
import { dataService } from '../../services/dataService';

interface HomePageProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onNavigateToFocus: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  tasks,
  onToggleTask,
  onNavigateToFocus,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'someday'>('all');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [todayTasks, setTodayTasks] = useState(dataService.getTodayTasks());
  const focusStats = dataService.getFocusStats();

  const handleAddTodayTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    const updated = dataService.addTodayTask(quickTaskTitle);
    setTodayTasks(updated);
    setQuickTaskTitle('');
  };

  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNote.trim()) return;
    dataService.addQuickNote(quickNote);
    setQuickNote('');
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === 'today') return task.isToday;
    if (activeFilter === 'upcoming') return !task.completed;
    if (activeFilter === 'someday') return task.priority === 'Low';
    return true;
  });

  // Calendar dates for October 2026
  const calendarDays = [
    null, null, null, 1, 2, 3, 4,
    5, 6, 7, 8, 9, 10, 11,
    12, 13, 14, 15, 16, 17, 18,
    19, 20, 21, 22, 23, 24, 25,
    26, 27, 28, 29, 30, 31, null,
  ];

  return (
    <div className="clockit-home-container">
      {/* 1. Hero Banner */}
      <section className="clockit-hero-card" aria-label="Greeting and Immediate Priorities">
        <div className="clockit-hero-overlay" />
        
        {/* Top greeting row */}
        <div className="clockit-hero-top">
          <div>
            <p className="clockit-hero-greeting-sub">Good morning,</p>
            <h1 className="clockit-hero-greeting-title">Ashay.</h1>
            <p className="clockit-hero-greeting-matters">Here's what matters next.</p>
          </div>
          <div className="clockit-hero-quote">
            “Discipline today for a freer tomorrow.”
          </div>
        </div>

        {/* Floating Action Cards */}
        <div className="clockit-hero-cards-row">
          {/* Card 1: Next In Line */}
          <div className="clockit-hero-next-card">
            <div>
              <div className="clockit-hero-next-badges">
                <span className="clockit-badge-next">
                  <HomeIcon size={12} />
                  <span>Next in line</span>
                </span>
                <span className="clockit-badge-critical">CRITICAL</span>
              </div>
              <h2 className="clockit-hero-next-title">PBL Final Report</h2>
              <div className="clockit-hero-next-meta">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileText size={13} />
                  <span>College</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CalendarIcon size={13} />
                  <span>1 Nov 2026 (6 days left)</span>
                </span>
              </div>
            </div>

            <div className="clockit-hero-next-right">
              <button
                className="clockit-hero-arrow-btn"
                aria-label="View task details"
                title="View task details"
                type="button"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Card 2: Let's focus */}
          <div className="clockit-hero-focus-card">
            <div>
              <h2 className="clockit-focus-title">Let's focus</h2>
              <p className="clockit-focus-sub">Ready to work on this task?</p>
            </div>
            <div>
              <button
                className="clockit-focus-btn"
                onClick={onNavigateToFocus}
                type="button"
              >
                <Play size={15} fill="currentColor" />
                <span>Start Focus</span>
              </button>
              <p className="clockit-focus-est">Estimate: 2–3 hrs</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main 2-Column Content Grid */}
      <div className="clockit-home-columns">
        {/* Left Column: Task Overview Table */}
        <section className="clockit-tasks-card" aria-label="Task List">
          {/* Filter Bar */}
          <div className="clockit-tasks-filter-bar">
            <div className="clockit-filter-pills" role="tablist">
              <button
                className={`clockit-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
                type="button"
              >
                All Tasks
              </button>
              <button
                className={`clockit-filter-pill ${activeFilter === 'today' ? 'active' : ''}`}
                onClick={() => setActiveFilter('today')}
                type="button"
              >
                Today
              </button>
              <button
                className={`clockit-filter-pill ${activeFilter === 'upcoming' ? 'active' : ''}`}
                onClick={() => setActiveFilter('upcoming')}
                type="button"
              >
                Upcoming
              </button>
              <button
                className={`clockit-filter-pill ${activeFilter === 'someday' ? 'active' : ''}`}
                onClick={() => setActiveFilter('someday')}
                type="button"
              >
                Someday
              </button>
            </div>

            <div className="clockit-tasks-sort">
              <span>Sort by</span>
              <select className="clockit-sort-select" aria-label="Sort tasks">
                <option>Deadline (Nearest)</option>
                <option>Priority (Highest)</option>
                <option>Workspace</option>
              </select>
              <button className="clockit-icon-action-btn" aria-label="Filter options" type="button">
                <SlidersHorizontal size={15} />
              </button>
            </div>
          </div>

          {/* Task Rows List */}
          <div className="clockit-tasks-list">
            {filteredTasks.map((task) => (
              <div key={task.id} className="clockit-task-row">
                <div className="clockit-task-left">
                  <div
                    className={`clockit-task-checkbox ${task.completed ? 'checked' : ''}`}
                    onClick={() => onToggleTask(task.id)}
                    role="checkbox"
                    aria-checked={task.completed}
                    tabIndex={0}
                  >
                    {task.completed && '✓'}
                  </div>
                  <span className={`clockit-task-title ${task.completed ? 'completed' : ''}`}>
                    {task.title}
                  </span>
                </div>

                <div className="clockit-task-right">
                  <span className="clockit-task-workspace-tag">
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: task.categoryColor,
                      }}
                    />
                    <span>{task.workspace}</span>
                  </span>

                  <span className="clockit-task-deadline">
                    <CalendarIcon size={13} color="var(--text-muted)" />
                    <span>{task.deadline} ({task.daysLeft})</span>
                  </span>

                  <span className={`clockit-priority-badge ${task.priority}`}>
                    {task.priority}
                  </span>

                  <button className="clockit-icon-action-btn" aria-label="More" type="button">
                    <MoreHorizontal size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Widgets */}
        <aside className="clockit-widgets-column" aria-label="Sidebar Widgets">
          {/* Widget 1: October 2026 Mini Calendar */}
          <div className="clockit-widget-card">
            <div className="clockit-widget-header">
              <span className="clockit-widget-title">October 2026</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="clockit-icon-action-btn" style={{ padding: 2 }} type="button">&lt;</button>
                <button className="clockit-icon-action-btn" style={{ padding: 2 }} type="button">&gt;</button>
              </div>
            </div>

            <div className="clockit-calendar-grid">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className="clockit-calendar-day-header">{day}</div>
              ))}
              {calendarDays.map((date, idx) => (
                <div
                  key={idx}
                  className={`clockit-calendar-day ${date === 26 ? 'active' : ''}`}
                >
                  {date || ''}
                </div>
              ))}
            </div>
          </div>

          {/* Widget 2: Today Tasks */}
          <div className="clockit-widget-card">
            <div className="clockit-widget-header">
              <span className="clockit-widget-title">Today</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>0 / 3 done</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {todayTasks.map((item) => (
                <div key={item.id} className="clockit-today-item">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <span>{item.title}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddTodayTask} className="clockit-quick-add-row">
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

          {/* Widget 3: Focus Stats */}
          <div className="clockit-widget-card">
            <div className="clockit-widget-header">
              <span className="clockit-widget-title">Focus Stats</span>
              <select className="clockit-sort-select" style={{ fontSize: 11 }}>
                <option>Today</option>
                <option>This Week</option>
              </select>
            </div>

            <div className="clockit-focus-stats-body">
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
                    strokeDasharray="213"
                    strokeDashoffset="75"
                    strokeLinecap="round"
                    transform="rotate(-90 43 43)"
                  />
                </svg>
                <div className="clockit-focus-donut-text">
                  <div>2h 15m</div>
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

          {/* Widget 4: Quick Notes */}
          <div className="clockit-widget-card">
            <div className="clockit-widget-header">
              <span className="clockit-widget-title">Quick Notes</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="clockit-icon-action-btn" style={{ padding: 2 }} type="button">
                  <Plus size={14} />
                </button>
                <button className="clockit-icon-action-btn" style={{ padding: 2 }} type="button">
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddQuickNote} className="clockit-notes-input-wrap">
              <input
                type="text"
                placeholder="Jot down a thought..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                aria-label="Jot down a thought"
              />
              <button
                type="submit"
                className="clockit-icon-action-btn"
                style={{ padding: 2 }}
                aria-label="Submit note"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
};
