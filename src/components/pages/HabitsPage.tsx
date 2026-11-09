import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Flame,
  Check,
  Clock,
  Target,
  CircleCheckBig,
  Sun,
  Dumbbell,
  Book,
  Laptop,
  GraduationCap,
  Leaf,
  Smartphone,
  FileText,
} from 'lucide-react';
import { HabitItem } from '../../data/mockData';
import { dataService, ANCHOR_DATE } from '../../services/dataService';

interface HabitsPageProps {
  habits: HabitItem[];
  onToggleHabit: (id: string) => void;
}

type HabitTab = 'Overview' | 'Streaks' | 'Consistency';

const TABS: HabitTab[] = ['Overview', 'Streaks', 'Consistency'];

/** Every calendar status maps to how much of the day's routine was kept. */
const STATUS_WEIGHT: Record<string, number> = {
  all: 1,
  active: 1,
  partial: 0.66,
  minimal: 0.33,
  missed: 0,
};

const STATUS_RING: Record<string, { color: string; dash?: string }> = {
  all: { color: '#22c55e' },
  partial: { color: '#34d399', dash: '7 3' },
  minimal: { color: '#f59e0b', dash: '4 4' },
  missed: { color: '#ef4444' },
};

const STATUS_LABEL: Record<string, string> = {
  all: 'All done',
  partial: 'Partial',
  minimal: 'Minimal',
  missed: 'Missed',
  active: 'Today',
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const RING_RADIUS = 22;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** October 2026 — the calendar month the tracked habit days belong to. */
const MONTH_LABEL = new Date(`${ANCHOR_DATE}T00:00:00`).toLocaleDateString('en-US', {
  month: 'long',
  year: 'numeric',
});

export const HabitsPage: React.FC<HabitsPageProps> = ({ habits, onToggleHabit }) => {
  const [activeTab, setActiveTab] = useState<HabitTab>('Overview');
  const [checkedPulse, setCheckedPulse] = useState<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const calendarDays = useMemo(() => dataService.getHabitCalendarDays(), []);

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

  // ---------- Derived, real metrics ----------

  const totalHabits = habits.length;
  const completedCount = habits.filter((h) => h.completed).length;
  const completionPct = totalHabits ? Math.round((completedCount / totalHabits) * 100) : 0;
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  const trackedDays = useMemo(
    () => calendarDays.filter((d) => d.status !== 'active'),
    [calendarDays],
  );
  const consistency = trackedDays.length
    ? Math.round(
        (trackedDays.reduce((sum, d) => sum + (STATUS_WEIGHT[d.status] ?? 0), 0) /
          trackedDays.length) *
          100,
      )
    : 0;
  const allDoneDays = calendarDays.filter((d) => d.status === 'all').length;

  /** Split the month into 7-day blocks so progress reads week by week. */
  const weeklyProgress = useMemo(() => {
    const weeks: { label: string; pct: number }[] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      const chunk = calendarDays.slice(i, i + 7);
      const pct = Math.round(
        (chunk.reduce((sum, d) => sum + (STATUS_WEIGHT[d.status] ?? 0), 0) / chunk.length) * 100,
      );
      weeks.push({ label: `W${weeks.length + 1}`, pct });
    }
    return weeks;
  }, [calendarDays]);

  /**
   * Average completion per weekday. October 2026 starts on a Thursday, so
   * day 1 sits at index 3 in a Monday-first week.
   */
  const weekdayRhythm = useMemo(() => {
    const buckets: number[][] = Array.from({ length: 7 }, () => []);
    calendarDays.forEach((d) => {
      const index = (3 + d.day - 1) % 7;
      buckets[index].push(STATUS_WEIGHT[d.status] ?? 0);
    });
    return buckets.map((values, index) => ({
      label: WEEKDAY_INITIALS[index],
      full: WEEKDAY_LABELS[index],
      pct: values.length
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100)
        : 0,
    }));
  }, [calendarDays]);

  const rankedHabits = useMemo(() => [...habits].sort((a, b) => b.streak - a.streak), [habits]);

  // ---------- Interactions ----------

  const handleToggleHabit = (habit: HabitItem) => {
    const willComplete = !habit.completed;
    onToggleHabit(habit.id);
    if (willComplete) {
      setCheckedPulse((prev) => ({ ...prev, [habit.id]: (prev[habit.id] ?? 0) + 1 }));
    }
  };

  const renderMiniBars = (values: number[], color: string, barWidth = 5) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
      {values.map((value, index) => (
        <div
          key={index}
          className="clockit-data-bar"
          style={{
            width: barWidth,
            height: Math.max(3, Math.round(value * 28)),
            borderRadius: 2,
            backgroundColor: color,
            animationDelay: `${Math.min(index * 14, 200)}ms`,
          }}
        />
      ))}
    </div>
  );

  const renderCheckbox = (habit: HabitItem) => {
    const pulsing = habit.completed && (checkedPulse[habit.id] ?? 0) > 0;
    return (
      <div
        key={`${habit.id}-${checkedPulse[habit.id] ?? 0}`}
        className={`clockit-task-checkbox ${habit.completed ? 'checked' : ''} ${
          pulsing ? 'just-checked' : ''
        }`}
        onClick={() => handleToggleHabit(habit)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleToggleHabit(habit);
          }
        }}
        role="checkbox"
        aria-checked={habit.completed}
        aria-label={habit.title}
        tabIndex={0}
        title={habit.completed ? 'Mark as not done' : 'Mark as done'}
      >
        {habit.completed && <Check size={12} />}
      </div>
    );
  };

  const renderHabitRow = (habit: HabitItem, compact = false) => (
    <div key={habit.id} className="clockit-task-row" style={{ padding: compact ? '9px 6px' : '11px 12px' }}>
      <div className="clockit-task-left">
        {renderHabitIcon(habit.iconName)}
        <div style={{ minWidth: 0 }}>
          <span className={`clockit-task-title ${habit.completed ? 'completed' : ''}`} style={{ fontSize: 13.5 }}>
            {habit.title}
          </span>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{habit.time}</div>
        </div>
      </div>
      <div className="clockit-task-right">
        <span className="clockit-habit-streak-flame" style={{ fontSize: 11.5 }}>
          <Flame size={12} />
          {habit.streak}d
        </span>
        {renderCheckbox(habit)}
      </div>
    </div>
  );

  const renderCalendar = () => (
    <>
      <div className="clockit-habit-calendar-grid" style={{ marginBottom: 6 }}>
        {WEEKDAY_LABELS.map((day) => (
          <span key={day} style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
            {day.slice(0, 1)}
          </span>
        ))}
      </div>

      <div className="clockit-habit-calendar-grid">
        {calendarDays.map((item) => {
          if (item.status === 'active') {
            return (
              <div key={item.day} className="clockit-habit-ring-cell" title={`Day ${item.day} · Today`}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-green)',
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

          const ring = STATUS_RING[item.status] ?? STATUS_RING.all;
          return (
            <div
              key={item.day}
              className="clockit-habit-ring-cell"
              title={`Day ${item.day} · ${STATUS_LABEL[item.status] ?? item.status}`}
            >
              <svg className="clockit-habit-ring-svg" viewBox="0 0 28 28">
                <circle
                  cx="14"
                  cy="14"
                  r="10"
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={2.5}
                  strokeDasharray={ring.dash ?? 'none'}
                />
              </svg>
              <span style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: -1 }}>{item.day}</span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 14,
          marginTop: 18,
          fontSize: 11,
          color: 'var(--text-secondary)',
        }}
      >
        {[
          { label: 'All done', color: '#22c55e' },
          { label: 'Partial', color: '#34d399' },
          { label: 'Minimal', color: '#f59e0b' },
          { label: 'Missed', color: '#ef4444' },
        ].map((legend) => (
          <span key={legend.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: legend.color }} />
            <span>{legend.label}</span>
          </span>
        ))}
      </div>
    </>
  );

  // ---------- Tab bodies ----------

  const overviewTab = (
    <>
      <section className="clockit-stats-grid-4" aria-label="Habit KPIs">
        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <Flame size={15} color="#ea580c" />
              <span>Best Streak</span>
            </div>
            <div className="clockit-stat-value">{maxStreak} days</div>
            <div className="clockit-stat-change" style={{ color: 'var(--text-muted)' }}>
              Longest running habit
            </div>
          </div>
          {renderMiniBars(weeklyProgress.map((w) => w.pct / 100), '#22c55e')}
        </div>

        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <CircleCheckBig size={15} color="#22c55e" />
              <span>Today</span>
            </div>
            <div className="clockit-stat-value">
              {completedCount} / {totalHabits}
            </div>
            <div className="clockit-stat-change" style={{ color: 'var(--text-muted)' }}>
              {completionPct}% completed
            </div>
          </div>
          <div className="clockit-kpi-ring">
            <svg width="54" height="54" viewBox="0 0 54 54">
              <circle
                className="clockit-kpi-ring-track"
                cx="27"
                cy="27"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="5"
              />
              <circle
                className="clockit-kpi-ring-progress"
                cx="27"
                cy="27"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - (mounted ? completionPct : 0) / 100)}
                transform="rotate(-90 27 27)"
              />
            </svg>
            <span className="clockit-kpi-ring-label">{completionPct}%</span>
          </div>
        </div>

        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <Target size={15} color="#8b5cf6" />
              <span>Consistency</span>
            </div>
            <div className="clockit-stat-value">{consistency}%</div>
            <div className="clockit-stat-change" style={{ color: 'var(--text-muted)' }}>
              Across {trackedDays.length} tracked days
            </div>
          </div>
          {renderMiniBars(weekdayRhythm.map((d) => d.pct / 100), '#8b5cf6', 5)}
        </div>

        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <Clock size={15} color="#f59e0b" />
              <span>Perfect Days</span>
            </div>
            <div className="clockit-stat-value">{allDoneDays}</div>
            <div className="clockit-stat-change" style={{ color: 'var(--text-muted)' }}>
              {MONTH_LABEL.split(' ')[0]} check-ins
            </div>
          </div>
          {renderMiniBars(
            calendarDays.map((d) => STATUS_WEIGHT[d.status] ?? 0),
            'var(--accent-mint)',
            2.5,
          )}
        </div>
      </section>

      <div className="clockit-chart-grid is-asymmetric">
        <div className="clockit-card" style={{ padding: 18 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>Today&apos;s Checklist</strong>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {completedCount} / {totalHabits} completed
            </span>
          </div>

          <div className="clockit-data-bar-track" style={{ marginBottom: 14 }}>
            <div
              className="clockit-data-bar-fill"
              style={{ width: `${completionPct}%`, background: 'var(--accent-mint)' }}
            />
          </div>

          {totalHabits === 0 ? (
            <div className="clockit-chart-empty">
              <strong>No habits yet</strong>
              <span>Add a habit to start tracking your routine.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {habits.map((habit) => renderHabitRow(habit, true))}
            </div>
          )}
        </div>

        <div className="clockit-card" style={{ padding: 18 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>Consistency Calendar</strong>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{MONTH_LABEL}</span>
          </div>
          {renderCalendar()}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="clockit-card" style={{ padding: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Weekly Progress</strong>
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{MONTH_LABEL}</span>
            </div>

            <div className="clockit-habit-rhythm">
              {weeklyProgress.map((week, index) => (
                <div key={week.label} className="clockit-habit-rhythm-col">
                  <div
                    className="clockit-habit-rhythm-bar"
                    style={{
                      height: Math.max(4, Math.round((week.pct / 100) * 74)),
                      animationDelay: `${index * 60}ms`,
                    }}
                    title={`${week.label} · ${week.pct}%`}
                  />
                  <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{week.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="clockit-card" style={{ padding: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Habit Streaks</strong>
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Top {Math.min(5, totalHabits)}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {rankedHabits.slice(0, 5).map((habit) => (
                <div key={habit.id} className="clockit-habit-streak-row">
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      minWidth: 0,
                      fontSize: 12.5,
                      fontWeight: 500,
                    }}
                  >
                    {renderHabitIcon(habit.iconName)}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {habit.title}
                    </span>
                  </span>
                  <span className="clockit-habit-streak-flame" style={{ fontSize: 12 }}>
                    <Flame size={12} />
                    {habit.streak}d
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const streaksTab = (
    <div className="clockit-card" style={{ padding: 20 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <div>
          <strong style={{ fontSize: 14.5, color: 'var(--text-primary)' }}>Streak Leaderboard</strong>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            Consecutive days each habit has been kept.
          </p>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Best · {maxStreak} days
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rankedHabits.map((habit, index) => (
          <div key={habit.id} className="clockit-habit-streak-row">
            <span
              style={{
                width: 18,
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              {index + 1}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              {renderHabitIcon(habit.iconName)}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {habit.title}
              </span>
            </span>
            <div className="clockit-data-bar-track" style={{ width: 150, flexShrink: 0 }}>
              <div
                className="clockit-data-bar-fill"
                style={{
                  width: `${maxStreak ? (habit.streak / maxStreak) * 100 : 0}%`,
                  background: habit.completed ? 'var(--accent-mint)' : 'var(--accent-green)',
                  animationDelay: `${Math.min(index * 45, 260)}ms`,
                }}
              />
            </div>
            <span className="clockit-habit-streak-flame" style={{ width: 46, justifyContent: 'flex-end' }}>
              <Flame size={13} />
              {habit.streak}d
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const consistencyTab = (
    <div className="clockit-chart-grid is-pair">
      <div className="clockit-card" style={{ padding: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>Consistency Calendar</strong>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{MONTH_LABEL}</span>
        </div>
        {renderCalendar()}
      </div>

      <div className="clockit-card" style={{ padding: 20 }}>
        <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>Rhythm by Weekday</strong>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 16px' }}>
          Average completion per day of week.
        </p>

        <div className="clockit-habit-rhythm">
          {weekdayRhythm.map((day, index) => (
            <div key={day.full} className="clockit-habit-rhythm-col" title={`${day.full} · ${day.pct}%`}>
              <div
                className="clockit-habit-rhythm-bar"
                style={{
                  height: Math.max(4, Math.round((day.pct / 100) * 74)),
                  animationDelay: `${index * 45}ms`,
                }}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{day.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="clockit-page-container">
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

      <div className="clockit-subtabs-row" role="tablist" aria-label="Habit views">
        {TABS.map((tab) => (
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

      <div className="clockit-cal-view" key={activeTab}>
        {activeTab === 'Overview' && overviewTab}
        {activeTab === 'Streaks' && streaksTab}
        {activeTab === 'Consistency' && consistencyTab}
      </div>
    </div>
  );
};

export default HabitsPage;
