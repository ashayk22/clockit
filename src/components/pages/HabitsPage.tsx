import React, { useState } from 'react';
import {
  Plus,
  Flame,
  Clock,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Sun,
  Dumbbell,
  Book,
  Laptop,
  GraduationCap,
  Leaf,
  Smartphone,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { HabitItem, HabitDayState } from '../../data/mockData';
import { dataService } from '../../services/dataService';

interface HabitsPageProps {
  habits: HabitItem[];
  onToggleHabit: (id: string) => void;
}

export const HabitsPage: React.FC<HabitsPageProps> = ({ habits, onToggleHabit }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'All Habits', 'Routines', 'Streaks', 'Insights'];
  const habitCalendarDays = dataService.getHabitCalendarDays();

  const renderHabitIcon = (iconName: HabitItem['iconName']) => {
    switch (iconName) {
      case 'sun': return <Sun size={15} color="#f59e0b" />;
      case 'dumbbell': return <Dumbbell size={15} color="#3b82f6" />;
      case 'book': return <Book size={15} color="#8b5cf6" />;
      case 'laptop': return <Laptop size={15} color="#3b82f6" />;
      case 'graduation-cap': return <GraduationCap size={15} color="#8b5cf6" />;
      case 'leaf': return <Leaf size={15} color="#22c55e" />;
      case 'smartphone': return <Smartphone size={15} color="#3b82f6" />;
      case 'file-text': return <FileText size={15} color="#6b7280" />;
      default: return <Clock size={15} />;
    }
  };

  const completedCount = habits.filter((h) => h.completed).length;

  return (
    <div className="clockit-page-container">
      {/* 1. Header */}
      <div className="clockit-page-header-row">
        <div>
          <h1 className="clockit-page-title">Habits</h1>
          <p className="clockit-page-subtitle">Small steps. Big changes.</p>
        </div>
        <button className="clockit-primary-btn" type="button">
          <Plus size={15} />
          <span>Add Habit</span>
        </button>
      </div>

      {/* 2. Sub-tabs Bar */}
      <div className="clockit-subtabs-row" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`clockit-subtab-pill ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Row 1: 4 Habit KPI Cards */}
      <section className="clockit-stats-grid-4" aria-label="Habit KPIs">
        {/* Card 1: Current Streak */}
        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <Flame size={15} color="#ea580c" />
              <span>Current Streak</span>
            </div>
            <div className="clockit-stat-value">12</div>
            <div className="clockit-stat-change" style={{ color: '#22c55e' }}>
              <span>▲</span> 3 from last week
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
            {[10, 14, 18, 22, 26, 32].map((h, i) => (
              <div key={i} style={{ width: 4.5, height: h, borderRadius: 2, backgroundColor: '#22c55e' }} />
            ))}
          </div>
        </div>

        {/* Card 2: Habits Today */}
        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2.5px solid #22c55e', borderTopColor: 'transparent' }} />
              <span>Habits Today</span>
            </div>
            <div className="clockit-stat-value">{completedCount} / {habits.length}</div>
            <div className="clockit-stat-change" style={{ color: 'var(--text-muted)' }}>
              {Math.round((completedCount / habits.length) * 100)}% completion
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
            {[16, 20, 24, 28, 26, 30].map((h, i) => (
              <div key={i} style={{ width: 4.5, height: h, borderRadius: 2, backgroundColor: '#22c55e' }} />
            ))}
          </div>
        </div>

        {/* Card 3: Longest Streak */}
        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <Clock size={15} color="#8b5cf6" />
              <span>Longest Streak</span>
            </div>
            <div className="clockit-stat-value">28 days</div>
            <div className="clockit-stat-change" style={{ color: '#22c55e' }}>
              <span>▲</span> 5 days
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
            {[12, 16, 20, 24, 28, 34].map((h, i) => (
              <div key={i} style={{ width: 4.5, height: h, borderRadius: 2, backgroundColor: '#8b5cf6' }} />
            ))}
          </div>
        </div>

        {/* Card 4: Consistency */}
        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <Star size={15} color="#f59e0b" />
              <span>Consistency</span>
            </div>
            <div className="clockit-stat-value">82%</div>
            <div className="clockit-stat-change" style={{ color: '#22c55e' }}>
              <span>▲</span> 12% from last month
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
            {[14, 18, 22, 26, 30, 34].map((h, i) => (
              <div key={i} style={{ width: 4.5, height: h, borderRadius: 2, backgroundColor: 'var(--accent-mint)' }} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Row 2: 3-Column Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1.35fr 1fr', gap: 18 }}>
        {/* Column 1: Today's Habits */}
        <div className="clockit-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>Today's Habits</strong>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{completedCount} / {habits.length} completed</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="clockit-task-row"
                style={{ padding: '9px 6px' }}
              >
                <div className="clockit-task-left">
                  {renderHabitIcon(habit.iconName)}
                  <div>
                    <span className={`clockit-task-title ${habit.completed ? 'completed' : ''}`} style={{ fontSize: 13.5 }}>
                      {habit.title}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{habit.time}</div>
                  </div>
                </div>

                <div className="clockit-task-right">
                  <div
                    className={`clockit-task-checkbox ${habit.completed ? 'checked' : ''}`}
                    onClick={() => onToggleHabit(habit.id)}
                    role="checkbox"
                    aria-checked={habit.completed}
                    tabIndex={0}
                    style={{ borderRadius: 6, width: 22, height: 22 }}
                  >
                    {habit.completed && <Check size={14} />}
                  </div>
                  <button className="clockit-icon-action-btn" type="button">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Habit Calendar with Ring Statuses */}
        <div className="clockit-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>Habit Calendar</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600 }}>
              <button className="clockit-icon-action-btn" style={{ padding: 2 }} type="button"><ChevronLeft size={14} /></button>
              <span>October 2026</span>
              <button className="clockit-icon-action-btn" style={{ padding: 2 }} type="button"><ChevronRight size={14} /></button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="clockit-habit-calendar-grid" style={{ marginBottom: 6 }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
              <span key={idx} style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                {day}
              </span>
            ))}
          </div>

          {/* Day Cells with Status Rings */}
          <div className="clockit-habit-calendar-grid">
            {habitCalendarDays.map((item) => {
              if (item.status === 'active') {
                return (
                  <div key={item.day} className="clockit-habit-ring-cell">
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {item.day}
                    </div>
                  </div>
                );
              }

              // Status ring color logic
              let ringColor = '#22c55e'; // 'all'
              let dash = 'none';
              let stroke = 2.5;

              if (item.status === 'partial') {
                ringColor = '#34d399';
                dash = '7 3';
              } else if (item.status === 'missed') {
                ringColor = '#ef4444';
              } else if (item.status === 'minimal') {
                ringColor = '#f59e0b';
                dash = '4 4';
              }

              return (
                <div key={item.day} className="clockit-habit-ring-cell">
                  <svg className="clockit-habit-ring-svg" viewBox="0 0 28 28">
                    <circle
                      cx="14"
                      cy="14"
                      r="10"
                      fill="none"
                      stroke={ringColor}
                      strokeWidth={stroke}
                      strokeDasharray={dash}
                    />
                  </svg>
                  <span style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: -1 }}>{item.day}</span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 18, fontSize: 11, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e' }} />
              <span>All done</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#34d399' }} />
              <span>Partial</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span>Missed</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span>Minimal</span>
            </span>
          </div>
        </div>

        {/* Column 3: Weekly Progress & Habit Streaks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Card 1: Weekly Progress */}
          <div className="clockit-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Weekly Progress</strong>
              <div className="clockit-sort-select" style={{ fontSize: 11, padding: '2px 6px' }}>This Week</div>
            </div>

            <div style={{ position: 'relative', height: 100, width: '100%' }}>
              {/* Y-axis guidelines */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 8.5 }}>
                <div>100%</div>
                <div>50%</div>
                <div>0%</div>
              </div>

              {/* Weekly Bars */}
              <div style={{ position: 'absolute', inset: '6px 0 0 28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                {[
                  { day: 'Mon', pct: 60 },
                  { day: 'Tue', pct: 75 },
                  { day: 'Wed', pct: 85 },
                  { day: 'Thu', pct: 50 },
                  { day: 'Fri', pct: 65 },
                  { day: 'Sat', pct: 90 },
                  { day: 'Sun', pct: 40 },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '11%' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${item.pct * 0.75}px`,
                        backgroundColor: '#22c55e',
                        borderRadius: '3px 3px 0 0',
                      }}
                    />
                    <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{item.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Habit Streaks Leaderboard */}
          <div className="clockit-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Habit Streaks</strong>
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
                <span>View all</span>
                <ArrowRight size={12} />
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 12.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Book size={14} color="#8b5cf6" />
                  <span style={{ fontWeight: 500 }}>Read</span>
                </span>
                <span style={{ color: '#ea580c', fontWeight: 600 }}>🔥 28 days</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Dumbbell size={14} color="#3b82f6" />
                  <span style={{ fontWeight: 500 }}>Workout</span>
                </span>
                <span style={{ color: '#ea580c', fontWeight: 600 }}>🔥 15 days</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Smartphone size={14} color="#3b82f6" />
                  <span style={{ fontWeight: 500 }}>No social media</span>
                </span>
                <span style={{ color: '#ea580c', fontWeight: 600 }}>🔥 12 days</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GraduationCap size={14} color="#8b5cf6" />
                  <span style={{ fontWeight: 500 }}>Meditate</span>
                </span>
                <span style={{ color: '#ea580c', fontWeight: 600 }}>🔥 8 days</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={14} color="#6b7280" />
                  <span style={{ fontWeight: 500 }}>Plan tomorrow</span>
                </span>
                <span style={{ color: '#ea580c', fontWeight: 600 }}>🔥 5 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
