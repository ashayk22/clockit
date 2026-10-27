import React, { useState } from 'react';
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
} from 'lucide-react';
import { TaskItem } from '../../data/mockData';
import { dataService } from '../../services/dataService';

interface TasksPageProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onNavigateToCalendar?: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  onToggleTask,
  onNavigateToCalendar,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'someday' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'matrix'>('list');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskItem['priority']>('Medium');
  const [newWorkspace, setNewWorkspace] = useState('Personal');

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    dataService.addTask(quickTaskTitle, 'Medium', 'Personal');
    setQuickTaskTitle('');
  };

  const handleModalAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    dataService.addTask(newTitle, newPriority, newWorkspace);
    setNewTitle('');
    setIsAddModalOpen(false);
  };

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === 'today') return task.isToday;
    if (activeFilter === 'upcoming') return !task.completed && !task.isToday;
    if (activeFilter === 'someday') return task.priority === 'Low';
    if (activeFilter === 'completed') return task.completed;
    return true;
  });

  const calendarDays = [
    null, null, null, 1, 2, 3, 4,
    5, 6, 7, 8, 9, 10, 11,
    12, 13, 14, 15, 16, 17, 18,
    19, 20, 21, 22, 23, 24, 25,
    26, 27, 28, 29, 30, 31, null,
  ];

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
          onClick={() => setIsAddModalOpen(true)}
          type="button"
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
              {(['all', 'today', 'upcoming', 'someday', 'completed'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  className={`clockit-filter-pill ${activeFilter === filterKey ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filterKey)}
                  type="button"
                >
                  {filterKey === 'all' && 'All Tasks'}
                  {filterKey === 'today' && 'Today'}
                  {filterKey === 'upcoming' && 'Upcoming'}
                  {filterKey === 'someday' && 'Someday'}
                  {filterKey === 'completed' && 'Completed'}
                </button>
              ))}
            </div>

            <div className="clockit-tasks-sort">
              <span>Sort by</span>
              <select className="clockit-sort-select" aria-label="Sort tasks">
                <option>Deadline (Nearest)</option>
                <option>Priority (Highest)</option>
                <option>Workspace</option>
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

          {/* Task Rows List */}
          <div className="clockit-tasks-list">
            {filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
                No tasks match this filter.
              </div>
            ) : (
              filteredTasks.map((task) => (
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
              ))
            )}
          </div>
        </section>

        {/* Right Column: Widgets */}
        <aside className="clockit-widgets-column">
          {/* 1. Calendar Widget */}
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
              <span>October 2026</span>
              <div style={{ display: 'flex', gap: 4 }}>
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

          {/* 2. Task Stats Card */}
          <div className="clockit-widget-card">
            <div className="clockit-widget-header">
              <span className="clockit-widget-title">Task Stats</span>
              <select className="clockit-sort-select" style={{ fontSize: 11.5 }}>
                <option>This week</option>
                <option>This month</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Donut Progress Ring */}
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
                    strokeDasharray="213"
                    strokeDashoffset="130"
                    strokeLinecap="round"
                    transform="rotate(-90 43 43)"
                  />
                </svg>
                <div className="clockit-focus-donut-text">
                  <div style={{ fontSize: 15 }}>3 / 8</div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 500 }}>Tasks done</div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span>3 Completed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#9ca3af' }} />
                  <span>4 Pending</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <span>1 Overdue</span>
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

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="clockit-card"
            style={{ width: 440, maxWidth: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, margin: '0 0 16px', color: 'var(--text-primary)' }}>Create New Task</h2>
            <form onSubmit={handleModalAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepare for Database Presentation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="clockit-quick-add-input"
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
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
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Workspace</label>
                  <select
                    value={newWorkspace}
                    onChange={(e) => setNewWorkspace(e.target.value)}
                    className="clockit-sort-select"
                    style={{ width: '100%', height: 38, marginTop: 4 }}
                  >
                    <option value="Personal">Personal</option>
                    <option value="College">College</option>
                    <option value="Club">Club</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Development">Development</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="clockit-filter-pill"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="clockit-primary-btn">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
