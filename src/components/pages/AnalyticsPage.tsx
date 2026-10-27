import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  ChevronDown,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [hoveredBar, setHoveredBar] = useState<number | null>(13); // Default hover on Oct 14

  // Tabs list matching reference
  const tabs = ['Overview', 'Focus', 'Tasks', 'Habits', 'Notes', 'Projects', 'Custom'];

  // 28 days of daily focus hours (Oct 1 to Oct 28)
  const dailyFocusHours = [
    2.5, 3.2, 4.0, 3.8, 4.5, 2.0, 1.8,
    3.5, 4.2, 5.0, 3.0, 4.8, 2.4, 5.33,
    3.8, 4.0, 4.5, 2.5, 3.0, 4.2, 3.6,
    4.0, 4.8, 3.2, 2.8, 4.5, 3.0, 4.2,
  ];

  // Heatmap: 16 weeks x 7 days
  const heatmapData = [
    [1, 0, 2, 3, 1, 0, 0],
    [2, 3, 4, 2, 1, 0, 1],
    [0, 1, 2, 3, 4, 1, 0],
    [2, 2, 3, 4, 3, 0, 0],
    [1, 3, 4, 2, 3, 1, 0],
    [3, 4, 2, 3, 4, 2, 1],
    [2, 3, 1, 4, 2, 0, 0],
    [4, 2, 3, 4, 3, 1, 1],
    [3, 4, 2, 1, 4, 2, 0],
    [2, 3, 4, 3, 2, 1, 0],
    [1, 2, 3, 4, 4, 0, 0],
    [3, 4, 2, 3, 3, 1, 1],
    [4, 3, 4, 2, 4, 2, 0],
    [2, 3, 4, 4, 3, 1, 0],
    [3, 4, 3, 2, 4, 0, 0],
    [4, 4, 3, 4, 2, 1, 0],
  ];

  const heatColors = [
    'var(--bg-surface-subtle)',
    'rgba(52, 211, 153, 0.25)',
    'rgba(52, 211, 153, 0.5)',
    'rgba(52, 211, 153, 0.75)',
    '#22c55e',
  ];

  return (
    <div className="clockit-page-container">
      {/* 1. Header Row */}
      <div className="clockit-page-header-row">
        <div>
          <h1 className="clockit-page-title">Analytics</h1>
          <p className="clockit-page-subtitle">See the bigger picture of your time, progress, and habits.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="clockit-sort-select" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 10px' }}>
            <CalendarIcon size={13} />
            <span>This Month</span>
            <ChevronDown size={13} />
          </div>
          <button className="clockit-icon-action-btn" type="button"><MoreHorizontal size={16} /></button>
        </div>
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

      {/* 3. Row 1: 4 KPI Cards with Sparklines */}
      <section className="clockit-stats-grid-4" aria-label="Key Performance Indicators">
        {/* Card 1: Total Focus Time */}
        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <Clock size={14} color="#22c55e" />
              <span>Total Focus Time</span>
            </div>
            <div className="clockit-stat-value">28h 15m</div>
            <div className="clockit-stat-change" style={{ color: '#22c55e' }}>
              <span>▲</span> 12% from last week
            </div>
          </div>
          {/* Mini Sparkline Bar Chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 34 }}>
            {[14, 20, 18, 24, 22, 32, 28].map((h, i) => (
              <div key={i} style={{ width: 4.5, height: h, borderRadius: 2, backgroundColor: '#22c55e' }} />
            ))}
          </div>
        </div>

        {/* Card 2: Tasks Completed */}
        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <CheckCircle2 size={14} color="#22c55e" />
              <span>Tasks Completed</span>
            </div>
            <div className="clockit-stat-value">24 / 32</div>
            <div className="clockit-stat-change" style={{ color: '#22c55e' }}>
              <span>▲</span> 8% from last week
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 34 }}>
            {[12, 16, 24, 18, 28, 30].map((h, i) => (
              <div key={i} style={{ width: 4.5, height: h, borderRadius: 2, backgroundColor: '#22c55e' }} />
            ))}
          </div>
        </div>

        {/* Card 3: Notes Created */}
        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <FileText size={14} color="#a855f7" />
              <span>Notes Created</span>
            </div>
            <div className="clockit-stat-value">18</div>
            <div className="clockit-stat-change" style={{ color: '#a855f7' }}>
              <span>▲</span> 50% from last week
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 34 }}>
            {[8, 14, 18, 26, 22, 32].map((h, i) => (
              <div key={i} style={{ width: 4.5, height: h, borderRadius: 2, backgroundColor: '#a855f7' }} />
            ))}
          </div>
        </div>

        {/* Card 4: Active Days */}
        <div className="clockit-stat-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
              <Calendar size={14} color="#3b82f6" />
              <span>Active Days</span>
            </div>
            <div className="clockit-stat-value">21 / 31</div>
            <div className="clockit-stat-change" style={{ color: '#3b82f6' }}>
              <span>▲</span> 3 days from last month
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 34 }}>
            {[18, 22, 20, 26, 28, 34].map((h, i) => (
              <div key={i} style={{ width: 4.5, height: h, borderRadius: 2, backgroundColor: '#3b82f6' }} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Row 2: 3 Visual Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.35fr 1.15fr', gap: 16 }}>
        {/* Chart 1: Time Distribution */}
        <div className="clockit-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Time Distribution</strong>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Where your time went this month</div>
            </div>
            <div className="clockit-sort-select" style={{ fontSize: 11, padding: '2px 6px' }}>This Month</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Multi-Segment Donut Chart */}
            <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                {/* 33% Web Dev (green) */}
                <circle cx="60" cy="60" r="44" fill="none" stroke="#22c55e" strokeWidth="16" strokeDasharray="91 185" strokeDashoffset="0" transform="rotate(-90 60 60)" />
                {/* 22% College (blue) */}
                <circle cx="60" cy="60" r="44" fill="none" stroke="#3b82f6" strokeWidth="16" strokeDasharray="61 215" strokeDashoffset="-91" transform="rotate(-90 60 60)" />
                {/* 16% Learning (purple) */}
                <circle cx="60" cy="60" r="44" fill="none" stroke="#8b5cf6" strokeWidth="16" strokeDasharray="44 232" strokeDashoffset="-152" transform="rotate(-90 60 60)" />
                {/* 11% Design (orange) */}
                <circle cx="60" cy="60" r="44" fill="none" stroke="#f97316" strokeWidth="16" strokeDasharray="30 246" strokeDashoffset="-196" transform="rotate(-90 60 60)" />
                {/* 8% Planning (amber) */}
                <circle cx="60" cy="60" r="44" fill="none" stroke="#f59e0b" strokeWidth="16" strokeDasharray="22 254" strokeDashoffset="-226" transform="rotate(-90 60 60)" />
                {/* 8% Others (gray) */}
                <circle cx="60" cy="60" r="44" fill="none" stroke="#6b7280" strokeWidth="16" strokeDasharray="22 254" strokeDashoffset="-248" transform="rotate(-90 60 60)" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>28h 15m</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Total Focus</div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11.5, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6.5, height: 6.5, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span>Web Development</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>9h 20m (33%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6.5, height: 6.5, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                  <span>College</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>6h 15m (22%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6.5, height: 6.5, borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                  <span>Learning</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>4h 30m (16%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6.5, height: 6.5, borderRadius: '50%', backgroundColor: '#f97316' }} />
                  <span>Design</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>3h 10m (11%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6.5, height: 6.5, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  <span>Planning</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>2h 20m (8%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6.5, height: 6.5, borderRadius: '50%', backgroundColor: '#6b7280' }} />
                  <span>Others</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>2h 20m (8%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Focus Trends */}
        <div className="clockit-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Focus Trends</strong>
            <div className="clockit-sort-select" style={{ fontSize: 11, padding: '2px 6px' }}>Daily</div>
          </div>

          <div style={{ position: 'relative', height: 135, width: '100%' }}>
            {/* Tooltip on Oct 14 */}
            {hoveredBar === 13 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '46%',
                  transform: 'translateX(-50%)',
                  background: 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10.5,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                5h 20m · Oct 14, 2026
              </div>
            )}

            {/* Y-axis guidelines */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 9.5 }}>
              <div style={{ borderBottom: '1px dashed var(--border-subtle)', paddingBottom: 2 }}>6h</div>
              <div style={{ borderBottom: '1px dashed var(--border-subtle)', paddingBottom: 2 }}>4h</div>
              <div style={{ borderBottom: '1px dashed var(--border-subtle)', paddingBottom: 2 }}>2h</div>
              <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>0h</div>
            </div>

            {/* Bars */}
            <div style={{ position: 'absolute', inset: '10px 0 0 24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 4 }}>
              {dailyFocusHours.map((hours, idx) => {
                const heightPct = (hours / 6) * 100;
                const isHovered = hoveredBar === idx;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredBar(idx)}
                    style={{
                      width: '2.5%',
                      height: `${heightPct}%`,
                      backgroundColor: isHovered ? '#10b981' : 'var(--accent-mint)',
                      borderRadius: '3px 3px 0 0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      opacity: isHovered ? 1 : 0.82,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 24, marginTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>
            <span>Oct 1</span>
            <span>Oct 7</span>
            <span>Oct 14</span>
            <span>Oct 21</span>
            <span>Oct 28</span>
          </div>
        </div>

        {/* Chart 3: Productivity Heatmap */}
        <div className="clockit-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Productivity Heatmap</strong>
          </div>

          {/* Month Headers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 22, fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {/* Day Labels */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', paddingBottom: 2 }}>
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>

            {/* Heat Matrix */}
            <div style={{ display: 'flex', gap: 3.5, flex: 1 }}>
              {heatmapData.map((week, wIdx) => (
                <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  {week.map((level, dIdx) => (
                    <div
                      key={dIdx}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: heatColors[level],
                      }}
                      title={`Activity level: ${level}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 14, fontSize: 10, color: 'var(--text-muted)' }}>
            <span>Less</span>
            {heatColors.map((col, idx) => (
              <span key={idx} style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: col }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* 5. Row 3: 3 Secondary Metric Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.35fr 1.15fr', gap: 16 }}>
        {/* Card 1: Top Projects / Spaces */}
        <div className="clockit-card" style={{ padding: 18 }}>
          <strong style={{ fontSize: 13.5, color: 'var(--text-primary)', display: 'block', marginBottom: 14 }}>
            Top Projects / Spaces
          </strong>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6.5, height: 6.5, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span>Personal</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>12h 10m</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-surface-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: '#22c55e' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6.5, height: 6.5, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                  <span>Web Dev</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>9h 20m</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-surface-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: '65%', height: '100%', background: '#3b82f6' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6.5, height: 6.5, borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                  <span>College</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>6h 15m</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-surface-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: '42%', height: '100%', background: '#8b5cf6' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6.5, height: 6.5, borderRadius: '50%', backgroundColor: '#f97316' }} />
                  <span>Freelance</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>3h 40m</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-surface-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: '25%', height: '100%', background: '#f97316' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Task Completion Rate Curve Chart */}
        <div className="clockit-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Task Completion Rate</strong>
            <span style={{ fontSize: 11, background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '2px 8px', borderRadius: 9999, fontWeight: 700 }}>
              75%
            </span>
          </div>

          <div style={{ position: 'relative', height: 115, width: '100%' }}>
            {/* Background grid */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: 9 }}>
              <div style={{ borderBottom: '1px dashed var(--border-subtle)', paddingBottom: 2 }}>100%</div>
              <div style={{ borderBottom: '1px dashed var(--border-subtle)', paddingBottom: 2 }}>50%</div>
              <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>0%</div>
            </div>

            {/* Smooth SVG Area Curve */}
            <div style={{ position: 'absolute', inset: '10px 0 0 24px' }}>
              <svg width="100%" height="100%" viewBox="0 0 300 85" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,65 Q 75,50 150,30 T 300,18 L 300,85 L 0,85 Z"
                  fill="url(#rateFill)"
                />
                <path
                  d="M 0,65 Q 75,50 150,30 T 300,18"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="0" cy="65" r="3.5" fill="#22c55e" />
                <circle cx="150" cy="30" r="3.5" fill="#22c55e" />
                <circle cx="300" cy="18" r="4.5" fill="#22c55e" stroke="#fff" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 24, marginTop: 4, fontSize: 9.5, color: 'var(--text-muted)' }}>
            <span>Oct 1</span>
            <span>Oct 7</span>
            <span>Oct 14</span>
            <span>Oct 21</span>
            <span>Oct 28</span>
          </div>
        </div>

        {/* Card 3: Focus vs Distractions */}
        <div className="clockit-card" style={{ padding: 18 }}>
          <strong style={{ fontSize: 13.5, color: 'var(--text-primary)', display: 'block', marginBottom: 14 }}>
            Focus vs Distractions
          </strong>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Donut */}
            <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="35" fill="none" stroke="var(--bg-surface-subtle)" strokeWidth="12" />
                {/* 78% Focused (green) */}
                <circle
                  cx="45"
                  cy="45"
                  r="35"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="12"
                  strokeDasharray="220"
                  strokeDashoffset="48"
                  strokeLinecap="round"
                  transform="rotate(-90 45 45)"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>78%</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Focused</div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 11.5, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6.5, height: 6.5, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                  <span>Focused Time</span>
                </span>
                <span style={{ fontWeight: 600 }}>28h 15m</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6.5, height: 6.5, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <span>Distractions</span>
                </span>
                <span style={{ fontWeight: 600 }}>8h 5m</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6.5, height: 6.5, borderRadius: '50%', backgroundColor: '#9ca3af' }} />
                  <span>Breaks</span>
                </span>
                <span style={{ fontWeight: 600 }}>3h 40m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
