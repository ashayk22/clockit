import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Music,
  Sliders,
  Maximize2,
  Clock,
  Crosshair,
  Coffee,
  BarChart3,
  Plus,
  ChevronRight,
  Volume2,
  SkipBack,
  SkipForward,
  MoreHorizontal,
  Send,
} from 'lucide-react';
import { dataService } from '../../services/dataService';

export const FocusPage: React.FC = () => {
  const initialDuration = 45 * 60; // 45:00 Deep work
  const [secondsLeft, setSecondsLeft] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'Deep Work' | 'Short Break' | 'Long Break'>('Deep Work');
  const [todayTasks, setTodayTasks] = useState(() => dataService.getTodayTasks());
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  // Active countdown effect
  useEffect(() => {
    let timer: any = null;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedDigits = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Calculate circular dial progress
  const totalSeconds = mode === 'Deep Work' ? 45 * 60 : 15 * 60;
  const radius = 140;
  const circumference = 2 * Math.PI * radius; // ~879.6
  
  // In initial state (not started), match reference screenshot showing an arc from 12 o'clock to ~2:15 o'clock (~19% arc)
  // When running, arc dynamically reflects remaining time or session progress
  const arcRatio = isRunning
    ? Math.max(0.04, (secondsLeft / totalSeconds))
    : 0.19;

  const strokeDashoffset = circumference * (1 - arcRatio);

  // Knob indicator position at the tip of the arc (starts at -90deg, 12 o'clock)
  const angle = (arcRatio * 360) - 90;
  const rad = (angle * Math.PI) / 180;
  const knobX = 170 + radius * Math.cos(rad);
  const knobY = 170 + radius * Math.sin(rad);

  const toggleTask = (id: string) => {
    const updated = dataService.toggleTodayTask(id);
    setTodayTasks(updated);
  };

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

  return (
    <div className="clockit-page-container">
      {/* 1. Centered Focus Dial Timer */}
      <section className="clockit-focus-dial-container" aria-label="Circular Focus Timer">
        <div className="clockit-focus-dial-stage">
          <svg width="340" height="340" viewBox="0 0 340 340" style={{ display: 'block', overflow: 'visible' }}>
            <defs>
              <linearGradient id="focusDialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Background Track Ring */}
            <circle
              cx="170"
              cy="170"
              r={radius}
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="12"
              opacity="0.35"
            />

            {/* Progress Arc */}
            <circle
              cx="170"
              cy="170"
              r={radius}
              fill="none"
              stroke="url(#focusDialGrad)"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 170 170)"
              style={{ transition: isRunning ? 'stroke-dashoffset 0.8s ease' : 'none' }}
            />

            {/* Glowing Knob Handle on Dial */}
            <circle
              cx={knobX}
              cy={knobY}
              r="8"
              fill="#ffffff"
              stroke="var(--accent-green)"
              strokeWidth="3.5"
              style={{ filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.9))' }}
            />
          </svg>

          {/* Center Text Information */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-mint)' }} />
              <span style={{ fontWeight: 500 }}>Focus</span>
            </div>
            <div className="clockit-dial-digits">{formattedDigits}</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', fontWeight: 500 }}>{mode}</div>
          </div>
        </div>

        {/* Side Stoic Quote */}
        <div className="clockit-focus-side-quote">
          “Consistency compounds.”
        </div>

        {/* 2. Control Pills Bar */}
        <div className="clockit-timer-controls-bar">
          <button
            className="clockit-timer-icon-btn"
            onClick={() => setMode(mode === 'Deep Work' ? 'Short Break' : 'Deep Work')}
            title="Switch Focus Mode"
            type="button"
          >
            <Clock size={17} />
          </button>

          <button
            className="clockit-timer-start-btn"
            onClick={() => setIsRunning(!isRunning)}
            type="button"
          >
            {isRunning ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
            <span>{isRunning ? 'Pause Focus' : 'Start Focus'}</span>
          </button>

          <button
            className="clockit-timer-icon-btn"
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(initialDuration);
            }}
            title="Reset Timer"
            type="button"
          >
            <Square size={16} />
          </button>

          <button
            className="clockit-timer-icon-btn"
            onClick={() => setIsPlayingMusic(!isPlayingMusic)}
            title="Music Deck"
            type="button"
          >
            <Music size={17} />
          </button>

          <button
            className="clockit-timer-icon-btn"
            title="Picture in Picture"
            type="button"
          >
            <Maximize2 size={16} />
          </button>

          <button
            className="clockit-timer-icon-btn"
            title="Timer Settings"
            type="button"
          >
            <Sliders size={16} />
          </button>
        </div>
      </section>

      {/* 3. Session Metrics Row (4 Cards) */}
      <section className="clockit-stats-grid-4" aria-label="Session Stats">
        <div className="clockit-stat-card">
          <div>
            <div className="clockit-stat-label">Session Time</div>
            <div className="clockit-stat-value">00:00:00</div>
          </div>
          <Clock size={18} color="var(--accent-mint)" />
        </div>

        <div className="clockit-stat-card">
          <div>
            <div className="clockit-stat-label">Focus Blocks</div>
            <div className="clockit-stat-value">0 / 3</div>
          </div>
          <Crosshair size={18} color="var(--accent-mint)" />
        </div>

        <div className="clockit-stat-card">
          <div>
            <div className="clockit-stat-label">Break in</div>
            <div className="clockit-stat-value">--:--</div>
          </div>
          <Coffee size={18} color="var(--accent-mint)" />
        </div>

        <div className="clockit-stat-card">
          <div>
            <div className="clockit-stat-label">Today Focus</div>
            <div className="clockit-stat-value">0m</div>
          </div>
          <BarChart3 size={18} color="var(--accent-mint)" />
        </div>
      </section>

      {/* 4. Bottom 2-Column Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Left: Today Task Queue */}
        <div className="clockit-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <strong style={{ fontSize: 14.5, color: 'var(--text-primary)' }}>Today</strong>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>0 / 3 done</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {todayTasks.map((task) => (
              <div key={task.id} className="clockit-task-row" style={{ padding: '10px 6px' }}>
                <div className="clockit-task-left">
                  <div
                    className={`clockit-task-checkbox ${task.completed ? 'checked' : ''}`}
                    onClick={() => toggleTask(task.id)}
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
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{task.deadline}</span>
                  <span className={`clockit-priority-badge ${task.priority}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
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

        {/* Right Stack: Music Player + Quick Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Music Widget */}
          <div className="clockit-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Music</strong>
              <Maximize2 size={13} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                🌅
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 650, color: 'var(--text-primary)' }}>Lo-fi Focus</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Chill lofi beats</div>
                
                {/* Audio Progress Track */}
                <div style={{ height: 4, background: 'var(--bg-surface-subtle)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ width: isPlayingMusic ? '60%' : '35%', height: '100%', background: 'var(--accent-mint)' }} />
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="clockit-icon-action-btn" type="button"><SkipBack size={15} /></button>
                <button
                  className="clockit-timer-icon-btn"
                  style={{ width: 32, height: 32, borderRadius: '50%' }}
                  onClick={() => setIsPlayingMusic(!isPlayingMusic)}
                  type="button"
                >
                  {isPlayingMusic ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                </button>
                <button className="clockit-icon-action-btn" type="button"><SkipForward size={15} /></button>
                <button className="clockit-icon-action-btn" type="button"><Volume2 size={15} /></button>
              </div>

              {/* Spotify Integration Badge */}
              <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#1db954', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, color: '#000', fontWeight: 900 }}>●</span>
              </div>
            </div>
          </div>

          {/* Quick Notes Widget */}
          <div className="clockit-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>Quick Notes</strong>
              <div style={{ display: 'flex', gap: 6 }}>
                <Plus size={14} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                <Maximize2 size={13} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
              </div>
            </div>

            <form onSubmit={handleAddQuickNote} className="clockit-notes-input-wrap">
              <input
                type="text"
                placeholder="Jot down a thought, idea, or anything..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                aria-label="Jot down a thought"
              />
              <button type="submit" className="clockit-icon-action-btn" style={{ padding: 2 }} aria-label="Submit">
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
