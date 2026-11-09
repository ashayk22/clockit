import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CircleCheckBig,
  FileText,
  Target,
} from 'lucide-react';
import { dataService, WORKSPACE_COLORS, ANCHOR_DATE } from '../../services/dataService';
import { notesStorage } from '../../services/notesStorage';
import type { FocusSession, HabitDayState, HabitItem, TaskItem } from '../../data/mockData';

/* ------------------------------------------------------------------ helpers */

const MS_DAY = 86400000;
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** The app's canonical "today". All ranges are measured back from here. */
const ANCHOR = new Date(`${ANCHOR_DATE}T00:00:00`);
const MONTH_START = new Date(ANCHOR.getFullYear(), ANCHOR.getMonth(), 1);
const MONTH_END = new Date(ANCHOR.getFullYear(), ANCHOR.getMonth() + 1, 0);

const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** "1h 20m" → 80 */
const minutesFromLabel = (label: string): number => {
  const h = /(\d+)\s*h/.exec(label);
  const m = /(\d+)\s*m/.exec(label);
  return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
};

const formatMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

type RangeKey = '7d' | '14d' | '30d';

const RANGE_OPTIONS: { key: RangeKey; label: string; days: number }[] = [
  { key: '7d', label: '7 days', days: 7 },
  { key: '14d', label: '14 days', days: 14 },
  { key: '30d', label: '30 days', days: 30 },
];

/* --------------------------------------------------------------- KPI ring */

const RING_RADIUS = 22;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const KpiRing: React.FC<{ pct: number; label: string }> = ({ pct, label }) => {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const clamped = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  const offset = RING_CIRCUMFERENCE - (clamped / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="clockit-kpi-ring">
      <svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true">
        <circle className="clockit-kpi-ring-track" cx="27" cy="27" r={RING_RADIUS} fill="none" strokeWidth="5" />
        <circle
          className="clockit-kpi-ring-progress"
          cx="27"
          cy="27"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={filled ? offset : RING_CIRCUMFERENCE}
          transform="rotate(-90 27 27)"
        />
      </svg>
      <span className="clockit-kpi-ring-label">{label}</span>
    </div>
  );
};

/* ------------------------------------------------------------------- page */

export const AnalyticsPage: React.FC = () => {
  const [range, setRange] = useState<RangeKey>('7d');
  const [tasks, setTasks] = useState<TaskItem[]>(() => dataService.getTasks());
  const [sessions, setSessions] = useState<FocusSession[]>(() => dataService.getFocusSessions());
  const [habits, setHabits] = useState<HabitItem[]>(() => dataService.getHabits());
  const [habitDays, setHabitDays] = useState<HabitDayState[]>(() => dataService.getHabitCalendarDays());
  const [noteCount, setNoteCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);

  // Live sync with the single app data store — every chart re-derives from here.
  useEffect(
    () =>
      dataService.subscribe(() => {
        setTasks(dataService.getTasks());
        setSessions(dataService.getFocusSessions());
        setHabits(dataService.getHabits());
        setHabitDays(dataService.getHabitCalendarDays());
      }),
    [],
  );

  // Notes live in IndexedDB — read once for the library stats.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await notesStorage.init();
        const all = await notesStorage.getAllNotes();
        if (!mounted) return;
        const live = all.filter((n) => !n.isTrash);
        setNoteCount(live.length);
        setFavoriteCount(live.filter((n) => n.isFavorite).length);
      } catch {
        /* storage unavailable — counts stay at their defaults */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const focusStats = useMemo(() => dataService.getFocusStats(), [sessions]);

  /* ------------------------------------------------------------ KPI values */

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const rangeMeta = RANGE_OPTIONS.find((r) => r.key === range) ?? RANGE_OPTIONS[0];
  const rangeStart = useMemo(
    () => new Date(ANCHOR.getTime() - (rangeMeta.days - 1) * MS_DAY),
    [rangeMeta.days],
  );

  /** Days inside the selected window that fall within the tracked month. */
  const trackedDays = useMemo(() => {
    let count = 0;
    for (let i = 0; i < rangeMeta.days; i++) {
      const d = new Date(rangeStart.getTime() + i * MS_DAY);
      if (d >= MONTH_START && d <= MONTH_END) count += 1;
    }
    return count;
  }, [rangeStart, rangeMeta.days]);

  /** Days with recorded focus time or a fully-kept habit day. */
  const activeDays = useMemo(() => {
    const active = new Set<string>();
    sessions.forEach((s) => {
      const d = new Date(s.completedAt);
      if (d >= rangeStart && d <= ANCHOR) active.add(toDateKey(d));
    });
    habitDays.forEach((hd) => {
      if (hd.status !== 'all' && hd.status !== 'active') return;
      const d = new Date(ANCHOR.getFullYear(), ANCHOR.getMonth(), hd.day);
      if (d >= rangeStart && d <= ANCHOR) active.add(toDateKey(d));
    });
    return active.size;
  }, [sessions, habitDays, rangeStart]);

  /* ------------------------------------------------------- focus breakdown */

  const breakdown = useMemo(() => {
    const deep = minutesFromLabel(focusStats.deepWork);
    const light = minutesFromLabel(focusStats.lightWork);
    const total = deep + light;
    return [
      { name: 'Deep work', minutes: deep, color: 'var(--accent-mint)' },
      { name: 'Light work', minutes: light, color: '#3b82f6' },
    ].map((row) => ({ ...row, pct: total ? Math.round((row.minutes / total) * 100) : 0 }));
  }, [focusStats]);

  const breakdownTotal = breakdown.reduce((acc, row) => acc + row.minutes, 0);
  const [donutFilled, setDonutFilled] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDonutFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  /* ------------------------------------------------------------ focus trend */

  const focusTrend = useMemo(() => {
    const byDay = new Map<string, number>();
    sessions.forEach((s) => {
      const key = toDateKey(new Date(s.completedAt));
      byDay.set(key, (byDay.get(key) ?? 0) + s.durationMinutes);
    });

    const buckets: { key: string; day: string; minutes: number }[] = [];
    for (let i = 0; i < rangeMeta.days; i++) {
      const d = new Date(rangeStart.getTime() + i * MS_DAY);
      const key = toDateKey(d);
      buckets.push({ key, day: `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`, minutes: byDay.get(key) ?? 0 });
    }
    return buckets;
  }, [sessions, rangeStart, rangeMeta.days]);

  const maxFocus = Math.max(0, ...focusTrend.map((b) => b.minutes));
  const totalFocusInRange = focusTrend.reduce((acc, b) => acc + b.minutes, 0);

  /* ------------------------------------------------------- upcoming workload */

  const workload = useMemo(() => {
    const buckets: { key: string; label: string; titles: string[] }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(ANCHOR.getTime() + i * MS_DAY);
      const key = toDateKey(d);
      buckets.push({
        key,
        label: `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()}`,
        titles: tasks.filter((t) => t.dueDate === key && !t.completed).map((t) => t.title),
      });
    }
    return buckets;
  }, [tasks]);

  const maxWorkload = Math.max(1, ...workload.map((b) => b.titles.length));
  const workloadTotal = workload.reduce((acc, b) => acc + b.titles.length, 0);

  /* ------------------------------------------------------------ breakdowns */

  const byWorkspace = useMemo(() => {
    const map = new Map<string, { count: number; focus: number }>();
    tasks.forEach((t) => {
      const current = map.get(t.workspace) ?? { count: 0, focus: 0 };
      current.count += 1;
      current.focus += t.focusMinutes ?? 0;
      map.set(t.workspace, current);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name,
        count: v.count,
        focus: v.focus,
        color: WORKSPACE_COLORS[name] ?? 'var(--accent-mint)',
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [tasks]);

  const maxWorkspaceCount = Math.max(1, ...byWorkspace.map((w) => w.count));

  const byPriority = useMemo(() => {
    const palette: Record<string, string> = {
      Critical: 'var(--badge-critical-text)',
      High: 'var(--badge-high-text)',
      Medium: 'var(--badge-medium-text)',
      Low: 'var(--badge-low-text)',
    };
    return (['Critical', 'High', 'Medium', 'Low'] as TaskItem['priority'][]).map((name) => ({
      name,
      count: tasks.filter((t) => t.priority === name).length,
      color: palette[name],
    }));
  }, [tasks]);

  const maxPriorityCount = Math.max(1, ...byPriority.map((p) => p.count));

  /* ------------------------------------------------------- habit consistency */

  const habitSummary = useMemo(() => {
    const kept = habitDays.filter((d) => d.status === 'all' || d.status === 'active').length;
    const partial = habitDays.filter((d) => d.status === 'partial' || d.status === 'minimal').length;
    const missed = habitDays.filter((d) => d.status === 'missed').length;
    const pct = habitDays.length ? Math.round((kept / habitDays.length) * 100) : 0;
    return { kept, partial, missed, pct, total: habitDays.length };
  }, [habitDays]);

  const habitStatusColor: Record<HabitDayState['status'], string> = {
    all: 'var(--accent-mint)',
    active: 'var(--accent-green)',
    partial: 'rgba(52, 211, 153, 0.55)',
    minimal: 'rgba(245, 158, 11, 0.6)',
    missed: 'var(--badge-critical-bg)',
  };

  const barHeightPct = (value: number, max: number) => (max > 0 ? Math.max(4, (value / max) * 100) : 4);

  /* ------------------------------------------------------------------ render */

  return (
    <div className="clockit-page-container">
      {/* 1. Header */}
      <div className="clockit-page-header-row">
        <div>
          <h1 className="clockit-page-title">Analytics</h1>
          <p className="clockit-page-subtitle">See the bigger picture of your time, progress, and habits.</p>
        </div>

        <div
          className="clockit-range-control"
          role="group"
          aria-label="Focus trend date range"
        >
          <CalendarIcon size={13} color="var(--text-muted)" style={{ marginLeft: 6, marginRight: 2 }} />
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`clockit-range-option${range === option.key ? ' is-active' : ''}`}
              aria-pressed={range === option.key}
              onClick={() => setRange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. KPI cards — all values derived from real app data */}
      <section className="clockit-stats-grid-4" aria-label="Key performance indicators">
        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <Clock size={14} color="var(--accent-mint)" />
              <span>Total Focus Time</span>
            </div>
            <div className="clockit-stat-value">{focusStats.timeFocused}</div>
            <div className="clockit-stat-change" style={{ color: 'var(--text-muted)' }}>
              {focusStats.sessions} sessions logged
            </div>
          </div>
          <KpiRing pct={focusStats.percentage} label={`${focusStats.percentage}%`} />
        </div>

        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <CircleCheckBig size={14} color="var(--accent-mint)" />
              <span>Tasks Completed</span>
            </div>
            <div className="clockit-stat-value">
              {completedTasks} / {totalTasks}
            </div>
            <div className="clockit-stat-change" style={{ color: 'var(--text-muted)' }}>
              {completionRate}% completion rate
            </div>
          </div>
          <KpiRing pct={completionRate} label={`${completionRate}%`} />
        </div>

        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <FileText size={14} color="var(--accent-mint)" />
              <span>Notes Created</span>
            </div>
            <div className="clockit-stat-value">{noteCount}</div>
            <div className="clockit-stat-change" style={{ color: 'var(--text-muted)' }}>
              {favoriteCount} favorites
            </div>
          </div>
          <KpiRing
            pct={noteCount ? Math.round((favoriteCount / noteCount) * 100) : 0}
            label={noteCount ? `${Math.round((favoriteCount / noteCount) * 100)}%` : '0%'}
          />
        </div>

        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <Target size={14} color="var(--accent-mint)" />
              <span>Active Days</span>
            </div>
            <div className="clockit-stat-value">
              {activeDays} / {trackedDays}
            </div>
            <div className="clockit-stat-change" style={{ color: 'var(--text-muted)' }}>
              in the last {rangeMeta.label}
            </div>
          </div>
          <KpiRing
            pct={trackedDays ? Math.round((activeDays / trackedDays) * 100) : 0}
            label={trackedDays ? `${Math.round((activeDays / trackedDays) * 100)}%` : '0%'}
          />
        </div>
      </section>

      {/* 3. Trend row */}
      <div className="clockit-chart-grid is-asymmetric">
        {/* Focus breakdown donut */}
        <div className="clockit-card" style={{ padding: 18 }}>
          <div style={{ marginBottom: 14 }}>
            <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Focus Breakdown</strong>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Deep vs. light work</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 118, height: 118, flexShrink: 0 }}>
              <svg width="118" height="118" viewBox="0 0 118 118" aria-hidden="true">
                <circle cx="59" cy="59" r="44" fill="none" stroke="var(--bg-surface-subtle)" strokeWidth="15" />
                {breakdown.map((row, idx) => {
                  const circumference = 2 * Math.PI * 44;
                  const share = breakdownTotal ? row.minutes / breakdownTotal : 0;
                  const offsetBase = breakdown
                    .slice(0, idx)
                    .reduce((acc, prev) => acc + (breakdownTotal ? prev.minutes / breakdownTotal : 0), 0);
                  return (
                    <circle
                      key={row.name}
                      cx="59"
                      cy="59"
                      r="44"
                      fill="none"
                      stroke={row.color}
                      strokeWidth="15"
                      strokeDasharray={`${share * circumference} ${circumference}`}
                      strokeDashoffset={donutFilled ? -offsetBase * circumference : 0}
                      strokeLinecap="butt"
                      transform="rotate(-90 59 59)"
                      style={{ transition: 'stroke-dasharray 900ms var(--motion-ease-out), stroke-dashoffset 900ms var(--motion-ease-out)' }}
                    />
                  );
                })}
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.15 }}>
                  {formatMinutes(breakdownTotal)}
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Total focus</div>
              </div>
            </div>

            <div className="clockit-legend" style={{ flex: 1 }}>
              {breakdown.map((row) => (
                <div key={row.name} className="clockit-legend-row">
                  <span className="clockit-legend-key">
                    <span className="clockit-legend-dot" style={{ backgroundColor: row.color }} />
                    <span>{row.name}</span>
                  </span>
                  <span className="clockit-legend-value">
                    {formatMinutes(row.minutes)} · {row.pct}%
                  </span>
                </div>
              ))}
              <div className="clockit-legend-row">
                <span className="clockit-legend-key">
                  <span className="clockit-legend-dot" style={{ backgroundColor: 'var(--bg-surface-hover)' }} />
                  <span>Sessions</span>
                </span>
                <span className="clockit-legend-value">{focusStats.sessions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Focus trend */}
        <div className="clockit-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Focus Trend</strong>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatMinutes(totalFocusInRange)} total</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 12 }}>
            Last {rangeMeta.label}
          </div>

          {maxFocus === 0 ? (
            <div className="clockit-chart-empty">
              <strong>No timed sessions in this range</strong>
              <span>Complete a focus session to see your daily trend here.</span>
            </div>
          ) : (
            <>
              {/* Keyed on the range so switching windows replays the staggered
                  bar entrance instead of snapping to the new heights. */}
              <div
                key={range}
                style={{ position: 'relative', height: 138, display: 'flex', alignItems: 'flex-end', gap: 3 }}
              >
                {focusTrend.map((bucket, idx) => (
                  <div
                    key={bucket.key}
                    style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}
                    onMouseEnter={() => setHovered(bucket.key)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div
                      className="clockit-data-bar"
                      style={{
                        width: '100%',
                        maxWidth: 22,
                        margin: '0 auto',
                        height: `${barHeightPct(bucket.minutes, maxFocus)}%`,
                        background:
                          hovered === bucket.key ? 'var(--accent-green)' : 'var(--accent-mint)',
                        borderRadius: '3px 3px 0 0',
                        animationDelay: `${Math.min(idx * 12, 240)}ms`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  fontSize: 10,
                  color: 'var(--text-muted)',
                }}
              >
                <span>{focusTrend[0]?.day}</span>
                <span>{focusTrend[Math.floor(focusTrend.length / 2)]?.day}</span>
                <span>{focusTrend[focusTrend.length - 1]?.day}</span>
              </div>
              {hovered && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, minHeight: 16 }}>
                  {(() => {
                    const b = focusTrend.find((x) => x.key === hovered);
                    return b ? `${b.day} · ${b.minutes > 0 ? formatMinutes(b.minutes) : 'No session'}` : '';
                  })()}
                </div>
              )}
            </>
          )}
        </div>

        {/* Upcoming workload */}
        <div className="clockit-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Upcoming Workload</strong>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{workloadTotal} due</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 12 }}>Next 14 days</div>

          {workloadTotal === 0 ? (
            <div className="clockit-chart-empty">
              <strong>Nothing scheduled ahead</strong>
              <span>Tasks with a due date will show up here.</span>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative', height: 138, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                {workload.map((bucket, idx) => (
                  <div
                    key={bucket.key}
                    style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}
                    onMouseEnter={() => setHovered(bucket.key)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div
                      className="clockit-data-bar"
                      style={{
                        width: '100%',
                        maxWidth: 22,
                        margin: '0 auto',
                        height: `${barHeightPct(bucket.titles.length, maxWorkload)}%`,
                        background:
                          bucket.titles.length === 0
                            ? 'var(--bg-surface-hover)'
                            : hovered === bucket.key
                              ? 'var(--accent-green)'
                              : 'var(--accent-mint)',
                        borderRadius: '3px 3px 0 0',
                        animationDelay: `${Math.min(idx * 18, 220)}ms`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  fontSize: 10,
                  color: 'var(--text-muted)',
                }}
              >
                <span>{workload[0]?.label}</span>
                <span>{workload[7]?.label}</span>
                <span>{workload[13]?.label}</span>
              </div>
              {hovered && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, minHeight: 16 }}>
                  {(() => {
                    const b = workload.find((x) => x.key === hovered);
                    if (!b) return '';
                    return b.titles.length
                      ? `${b.label} · ${b.titles.slice(0, 2).join(', ')}${b.titles.length > 2 ? ` +${b.titles.length - 2}` : ''}`
                      : `${b.label} · Free`;
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 4. Breakdown row */}
      <div className="clockit-chart-grid">
        {/* Tasks by workspace */}
        <div className="clockit-card" style={{ padding: 18 }}>
          <strong style={{ fontSize: 13.5, color: 'var(--text-primary)', display: 'block', marginBottom: 14 }}>
            Tasks by Workspace
          </strong>

          {byWorkspace.length === 0 ? (
            <div className="clockit-chart-empty">
              <strong>No tasks yet</strong>
              <span>Create a task to see the split.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
              {byWorkspace.map((row) => (
                <div key={row.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span className="clockit-legend-dot" style={{ backgroundColor: row.color }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.name}
                      </span>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {row.count} task{row.count === 1 ? '' : 's'}
                      {row.focus > 0 ? ` · ${formatMinutes(row.focus)}` : ''}
                    </span>
                  </div>
                  <div className="clockit-data-bar-track">
                    <div
                      className="clockit-data-bar-fill"
                      style={{ width: `${(row.count / maxWorkspaceCount) * 100}%`, background: row.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority mix */}
        <div className="clockit-card" style={{ padding: 18 }}>
          <strong style={{ fontSize: 13.5, color: 'var(--text-primary)', display: 'block', marginBottom: 14 }}>
            Priority Mix
          </strong>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
            {byPriority.map((row) => (
              <div key={row.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="clockit-legend-dot" style={{ backgroundColor: row.color }} />
                    <span>{row.name}</span>
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{row.count}</span>
                </div>
                <div className="clockit-data-bar-track">
                  <div
                    className="clockit-data-bar-fill"
                    style={{ width: `${(row.count / maxPriorityCount) * 100}%`, background: row.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--border-subtle)',
              fontSize: 11.5,
              color: 'var(--text-secondary)',
            }}
          >
            <span>Completion rate</span>
            <span style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{completionRate}%</span>
          </div>
        </div>

        {/* Habit consistency */}
        <div className="clockit-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Habit Consistency</strong>
            <span style={{ fontSize: 11.5, fontWeight: 650, color: 'var(--accent-green-text)' }}>
              {habitSummary.pct}%
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 5 }}>
            {habitDays.map((day) => (
              <span
                key={day.day}
                title={`Day ${day.day} · ${day.status}`}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 3,
                  background: habitStatusColor[day.status],
                  opacity: day.status === 'missed' ? 0.9 : 1,
                }}
              />
            ))}
          </div>

          <div className="clockit-legend" style={{ marginTop: 14 }}>
            <div className="clockit-legend-row">
              <span className="clockit-legend-key">
                <span className="clockit-legend-dot" style={{ backgroundColor: 'var(--accent-mint)' }} />
                <span>All habits kept</span>
              </span>
              <span className="clockit-legend-value">{habitSummary.kept} days</span>
            </div>
            <div className="clockit-legend-row">
              <span className="clockit-legend-key">
                <span className="clockit-legend-dot" style={{ backgroundColor: 'rgba(245, 158, 11, 0.6)' }} />
                <span>Partly kept</span>
              </span>
              <span className="clockit-legend-value">{habitSummary.partial} days</span>
            </div>
            <div className="clockit-legend-row">
              <span className="clockit-legend-key">
                <span className="clockit-legend-dot" style={{ backgroundColor: 'var(--badge-critical-bg)' }} />
                <span>Missed</span>
              </span>
              <span className="clockit-legend-value">{habitSummary.missed} days</span>
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
            Tracking {habits.length} habit{habits.length === 1 ? '' : 's'} · {habitSummary.total} days
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
