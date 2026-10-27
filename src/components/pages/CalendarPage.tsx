import React, { useState } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Check,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { CalendarEvent } from '../../data/mockData';

export const CalendarPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day' | 'Agenda'>('Month');
  const [selectedDay, setSelectedDay] = useState(26);
  const [visibleCalendars, setVisibleCalendars] = useState({
    Personal: true,
    College: true,
    Development: true,
    Freelance: true,
    Habits: true,
    Club: true,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('10:00 AM');
  const [newEventWorkspace, setNewEventWorkspace] = useState('Personal');

  const [events, setEvents] = useState(() => dataService.getCalendarEvents());
  const timelineEvents = dataService.getTimelineEvents();

  const toggleCalendarFilter = (key: keyof typeof visibleCalendars) => {
    setVisibleCalendars((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const added = dataService.addCalendarEvent({
      day: selectedDay,
      title: newEventTitle,
      time: newEventTime,
      workspace: newEventWorkspace,
      color: newEventWorkspace === 'College' ? '#3b82f6' : '#22c55e',
      tagColor: 'rgba(34, 197, 94, 0.15)',
    });
    setEvents(dataService.getCalendarEvents());
    setNewEventTitle('');
    setIsAddModalOpen(false);
  };

  // Month grid days matching reference screenshot October 2026:
  // Week 1: 28, 29, 30 (prev month), 1, 2, 3, 4
  // Week 2: 5, 6, 7, 8, 9, 10, 11
  // Week 3: 12, 13, 14, 15, 16, 17, 18
  // Week 4: 19, 20, 21, 22, 23, 24, 25
  // Week 5: 26, 27, 28, 29, 30, 31, 1 (next month)
  const monthWeeks = [
    [
      { day: 28, isOtherMonth: true },
      { day: 29, isOtherMonth: true },
      { day: 30, isOtherMonth: true },
      { day: 1, isOtherMonth: false },
      { day: 2, isOtherMonth: false },
      { day: 3, isOtherMonth: false },
      { day: 4, isOtherMonth: false },
    ],
    [
      { day: 5, isOtherMonth: false },
      { day: 6, isOtherMonth: false },
      { day: 7, isOtherMonth: false },
      { day: 8, isOtherMonth: false },
      { day: 9, isOtherMonth: false },
      { day: 10, isOtherMonth: false },
      { day: 11, isOtherMonth: false },
    ],
    [
      { day: 12, isOtherMonth: false },
      { day: 13, isOtherMonth: false },
      { day: 14, isOtherMonth: false },
      { day: 15, isOtherMonth: false },
      { day: 16, isOtherMonth: false },
      { day: 17, isOtherMonth: false },
      { day: 18, isOtherMonth: false },
    ],
    [
      { day: 19, isOtherMonth: false },
      { day: 20, isOtherMonth: false },
      { day: 21, isOtherMonth: false },
      { day: 22, isOtherMonth: false },
      { day: 23, isOtherMonth: false },
      { day: 24, isOtherMonth: false },
      { day: 25, isOtherMonth: false },
    ],
    [
      { day: 26, isOtherMonth: false },
      { day: 27, isOtherMonth: false },
      { day: 28, isOtherMonth: false },
      { day: 29, isOtherMonth: false },
      { day: 30, isOtherMonth: false },
      { day: 31, isOtherMonth: false },
      { day: 1, isOtherMonth: true },
    ],
  ];

  const miniCalDays = [
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
            onClick={() => setIsAddModalOpen(true)}
            type="button"
          >
            <Plus size={15} />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* 2. Month Selector Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="clockit-icon-action-btn" style={{ padding: 4 }} type="button">
            <ChevronLeft size={16} />
          </button>
          <button className="clockit-icon-action-btn" style={{ padding: 4 }} type="button">
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          className="clockit-filter-pill"
          onClick={() => setSelectedDay(26)}
          style={{ padding: '4px 12px', fontSize: 12.5 }}
          type="button"
        >
          Today
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
          October 2026
        </span>
      </div>

      {/* 3. Main Calendar 3-Column Split */}
      <div className="clockit-calendar-main-grid">
        {/* Column 1: Month Calendar Grid Table */}
        <div style={{ minWidth: 0, overflowX: 'auto', width: '100%' }}>
          <table className="clockit-month-calendar-table">
            <thead>
              <tr>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthWeeks.map((week, wIdx) => (
                <tr key={wIdx}>
                  {week.map((cell, dIdx) => {
                    const dayEvents = events.filter((e) => {
                      if (cell.isOtherMonth) return false;
                      return e.day === cell.day && visibleCalendars[e.workspace as keyof typeof visibleCalendars] !== false;
                    });
                    const isActive = !cell.isOtherMonth && cell.day === selectedDay;

                    return (
                      <td
                        key={dIdx}
                        className={isActive ? 'clockit-cal-cell-active' : ''}
                        onClick={() => !cell.isOtherMonth && setSelectedDay(cell.day)}
                        style={{
                          opacity: cell.isOtherMonth ? 0.38 : 1,
                          cursor: cell.isOtherMonth ? 'default' : 'pointer',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent-mint)' : 'var(--text-primary)', marginBottom: 4 }}>
                          {cell.day}
                        </div>

                        {/* Event Chips */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {dayEvents.map((ev) => (
                            <div
                              key={ev.id}
                              className="clockit-cal-event-chip"
                              style={{
                                backgroundColor: ev.tagColor || 'rgba(34, 197, 94, 0.15)',
                                color: 'var(--text-primary)',
                                borderLeft: `2.5px solid ${ev.color}`,
                              }}
                              title={`${ev.title} · ${ev.time}`}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: ev.color, flexShrink: 0 }} />
                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 11 }}>{ev.title}</span>
                                {ev.time && <span style={{ fontSize: 9.5, color: 'var(--text-secondary)', lineHeight: 1.1 }}>{ev.time}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Column 2: Mini Calendar + Calendars Filter List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Mini Calendar */}
          <div className="clockit-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12, fontWeight: 600 }}>
              <span>October 2026</span>
              <div style={{ display: 'flex', gap: 2 }}>
                <button className="clockit-icon-action-btn" style={{ padding: 1 }} type="button">&lt;</button>
                <button className="clockit-icon-action-btn" style={{ padding: 1 }} type="button">&gt;</button>
              </div>
            </div>

            <div className="clockit-calendar-grid" style={{ gap: 4 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className="clockit-calendar-day-header" style={{ fontSize: 9.5 }}>{day}</div>
              ))}
              {miniCalDays.map((date, idx) => (
                <div
                  key={idx}
                  className={`clockit-calendar-day ${date === selectedDay ? 'active' : ''}`}
                  onClick={() => date && setSelectedDay(date)}
                  style={{ height: 22, fontSize: 11 }}
                >
                  {date || ''}
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
                { name: 'Habits', color: '#ef4444' },
                { name: 'Club', color: '#a855f7' },
              ].map((cal) => {
                const isChecked = visibleCalendars[cal.name as keyof typeof visibleCalendars] !== false;
                return (
                  <div
                    key={cal.name}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    onClick={() => toggleCalendarFilter(cal.name as any)}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4, cursor: 'pointer' }}>
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
              <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>Today</strong>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Sun, 26 Oct 2026</div>
            </div>
            <button
              className="clockit-icon-action-btn"
              onClick={() => setIsAddModalOpen(true)}
              style={{ border: '1px solid var(--border-subtle)', padding: 3 }}
              type="button"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Timeline Events List */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {timelineEvents.map((item) => (
              <div key={item.id} className="clockit-timeline-item">
                <span className="clockit-timeline-time">{item.time}</span>
                <div className="clockit-timeline-content" style={{ borderLeftColor: item.color }}>
                  <h3 className="clockit-timeline-title">{item.title}</h3>
                  <p className="clockit-timeline-sub">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            className="clockit-filter-pill"
            onClick={() => setIsAddModalOpen(true)}
            style={{ width: '100%', marginTop: 12, padding: '7px 0', textAlign: 'center', fontSize: 12.5 }}
            type="button"
          >
            + Add event
          </button>
        </div>
      </div>

      {/* Add Event Modal */}
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
            style={{ width: 420, maxWidth: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, margin: '0 0 16px', color: 'var(--text-primary)' }}>Add Calendar Event</h2>
            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Sprint Sync"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="clockit-quick-add-input"
                  style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Time</label>
                  <input
                    type="text"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="clockit-quick-add-input"
                    style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, height: 38 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Calendar</label>
                  <select
                    value={newEventWorkspace}
                    onChange={(e) => setNewEventWorkspace(e.target.value)}
                    className="clockit-sort-select"
                    style={{ width: '100%', height: 38, marginTop: 4 }}
                  >
                    <option value="Personal">Personal</option>
                    <option value="College">College</option>
                    <option value="Development">Development</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Habits">Habits</option>
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
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
