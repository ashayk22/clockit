import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Volume2,
  SkipBack,
  SkipForward,
  Send,
  CircleCheckBig,
  X,
  Target,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { TaskItem } from '../../data/mockData';

type FocusMode = 'Deep Work' | 'Short Break' | 'Long Break';

const MODE_DURATIONS: Record<FocusMode, number> = {
  'Deep Work': 45 * 60,
  'Short Break': 15 * 60,
  'Long Break': 20 * 60,
};

/* Dial geometry — the annulus the remaining-time mechanism rides on. */
const DIAL_RADIUS = 140;
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;

export const FocusPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => dataService.getTasks());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => dataService.getSelectedFocusTaskId());

  // Subscribe to changes in dataService
  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setTasks(dataService.getTasks());
      setSelectedTaskId(dataService.getSelectedFocusTaskId());
    });
    return unsubscribe;
  }, []);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const [secondsLeft, setSecondsLeft] = useState(MODE_DURATIONS['Deep Work']);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<FocusMode>('Deep Work');
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);

  // Completion modal/prompt state
  const [showSessionCompletePrompt, setShowSessionCompletePrompt] = useState(false);
  const [completedSessionDetails, setCompletedSessionDetails] = useState<{ duration: number; taskTitle: string } | null>(null);

  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  // Brief, non-blocking completion feedback for the dial.
  const [justCompleted, setJustCompleted] = useState(false);
  const completionTimerRef = useRef<number | null>(null);
  // Brief settle when the mode changes, so switching reads as a movement of the
  // same instrument rather than an instant swap.
  const [isSwitching, setIsSwitching] = useState(false);
  const switchTimerRef = useRef<number | null>(null);

  // --- Continuous dial mechanism ------------------------------------------
  // The sweep needle, the remaining-time arc and its end-cap are driven
  // imperatively by a requestAnimationFrame loop. The per-second React tick
  // still owns the readout and the timer itself, but the *motion* is
  // interpolated between ticks so the mechanism sweeps continuously instead of
  // stepping (and restarting) once a second.
  const arcRef = useRef<SVGCircleElement | null>(null);
  const capRef = useRef<SVGGElement | null>(null);
  const sweepRef = useRef<SVGGElement | null>(null);
  /** Wall-clock stamp of the most recent whole-second tick. */
  const tickAtRef = useRef<number>(0);
  /** Fraction of the current second already burned — frozen while paused. */
  const fracRef = useRef<number>(0);
  /** Latest timer state, mirrored so the frame loop always reads it fresh. */
  const modeRef = useRef(mode);
  const secondsRef = useRef(secondsLeft);
  const elapsedRef = useRef(sessionElapsedSeconds);
  const runningRef = useRef(isRunning);
  modeRef.current = mode;
  secondsRef.current = secondsLeft;
  elapsedRef.current = sessionElapsedSeconds;
  runningRef.current = isRunning;
  // One-shot guard: a run is recorded exactly once, however the countdown ends
  // (tick reaching zero, or the end-session button). Cleared when a new run starts.
  const sessionRecordedRef = useRef(false);
  useEffect(
    () => () => {
      if (completionTimerRef.current) window.clearTimeout(completionTimerRef.current);
      if (switchTimerRef.current) window.clearTimeout(switchTimerRef.current);
    },
    [],
  );

  // Today tasks from shared store
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.isToday || t.daysLeft === 'Today');
  }, [tasks]);

  const focusStats = useMemo(() => {
    return dataService.getFocusStats();
  }, [tasks]);

  // Active countdown timer effect
  useEffect(() => {
    if (!isRunning) return;
    if (secondsLeft <= 0) {
      // Countdown finished — hand off to the single recording path.
      handleCompleteSession();
      return;
    }
    const timer = window.setInterval(() => {
      // Stamp the tick so the frame loop can interpolate the whole second that
      // follows it, keeping the mechanism locked to the real countdown.
      tickAtRef.current = performance.now();
      setSecondsLeft((prev) => Math.max(0, prev - 1));
      setSessionElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
    // handleCompleteSession is read fresh each tick; adding it to the deps
    // would tear down and rebuild the interval on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, secondsLeft]);

  const handleCompleteSession = () => {
    // One-shot guard — see sessionRecordedRef.
    if (sessionRecordedRef.current) return;
    sessionRecordedRef.current = true;

    // Read the canonical mode duration directly so this stays correct wherever
    // it sits in the render body.
    const total = MODE_DURATIONS[mode];
    const durationMins = Math.max(1, Math.round((total - secondsLeft) / 60));

    // Stop the timer up-front: the tick-effect and the manual "end session"
    // button share this path, so this guarantees one record per session.
    setIsRunning(false);

    dataService.recordFocusSession({
      taskId: selectedTaskId,
      taskTitle: selectedTask?.title,
      mode,
      durationMinutes: durationMins,
    });

    // Brief, subtle completion flourish — never blocks the timer.
    setJustCompleted(true);
    if (completionTimerRef.current) window.clearTimeout(completionTimerRef.current);
    completionTimerRef.current = window.setTimeout(() => setJustCompleted(false), 900);

    if (selectedTask && !selectedTask.completed) {
      setCompletedSessionDetails({
        duration: durationMins,
        taskTitle: selectedTask.title,
      });
      setShowSessionCompletePrompt(true);
    }

    setSecondsLeft(MODE_DURATIONS[mode]);
    setSessionElapsedSeconds(0);
    tickAtRef.current = performance.now();
    fracRef.current = 0;
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedDigits = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Elapsed readout — the counterpart to the remaining digits.
  const elapsedMins = Math.floor(sessionElapsedSeconds / 60);
  const elapsedSecs = sessionElapsedSeconds % 60;
  const formattedElapsed = `${String(elapsedMins).padStart(2, '0')}:${String(elapsedSecs).padStart(2, '0')}`;

  // Timepiece geometry

  // The mechanism itself: one frame loop interpolates the sweep needle, the
  // remaining-time arc and its end-cap between the timer's whole-second ticks.
  // Reading the wall clock (rather than re-triggering a CSS transition every
  // second) means the motion is continuous and never restarts.
  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let frame = 0;
    const draw = () => {
      const arc = arcRef.current;
      const cap = capRef.current;
      const needle = sweepRef.current;
      if (arc && cap && needle) {
        let frac = 0;
        if (runningRef.current && !reduced) {
          frac = Math.min(1, Math.max(0, (performance.now() - tickAtRef.current) / 1000));
          fracRef.current = frac;
        } else if (!reduced) {
          // Paused mid-session: the mechanism holds exactly where it stopped.
          frac = fracRef.current;
        }

        const total = MODE_DURATIONS[modeRef.current];
        const remaining = Math.max(0, secondsRef.current - frac);
        const ratio = Math.min(1, remaining / total);
        const consumed = (1 - ratio) * 360;

        // The ring drains clockwise from 12 o'clock; its end-cap rides the head.
        arc.style.strokeDashoffset = String(DIAL_CIRCUMFERENCE * (1 - ratio));
        arc.style.transform = `rotate(${consumed - 90}deg)`;
        cap.style.transform = `rotate(${consumed}deg)`;
        // Needle: one quiet revolution per minute of true elapsed time.
        needle.style.transform = `rotate(${(elapsedRef.current + frac) * 6}deg)`;
      }
      frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleTask = (id: string) => {
    dataService.toggleTask(id);
  };

  const handleSelectTask = (taskId: string) => {
    dataService.setSelectedFocusTaskId(taskId);
  };

  /** Switching modes resets the dial so a break never inherits focus time. */
  const switchMode = (next: FocusMode) => {
    sessionRecordedRef.current = false;
    setMode(next);
    setSecondsLeft(MODE_DURATIONS[next]);
    setIsRunning(false);
    setSessionElapsedSeconds(0);
    tickAtRef.current = performance.now();
    fracRef.current = 0;
    // Re-run the settle even when the same tab is pressed twice in a row.
    setIsSwitching(false);
    window.requestAnimationFrame(() => setIsSwitching(true));
    if (switchTimerRef.current) window.clearTimeout(switchTimerRef.current);
    switchTimerRef.current = window.setTimeout(() => setIsSwitching(false), 520);
  };

  /** Start ⇄ Pause. Starting or resuming clears the one-shot record guard. */
  const handleStartPause = () => {
    if (!isRunning) {
      sessionRecordedRef.current = false;
      // Resume the sweep from where it was paused instead of snapping back.
      tickAtRef.current = performance.now() - fracRef.current * 1000;
    }
    setIsRunning(!isRunning);
  };

  /** End/reset: logs a qualifying run once, otherwise just clears the dial. */
  const handleResetSession = () => {
    if (isRunning && sessionElapsedSeconds > 60) {
      handleCompleteSession();
      return;
    }
    sessionRecordedRef.current = false;
    setIsRunning(false);
    setSecondsLeft(MODE_DURATIONS[mode]);
    setSessionElapsedSeconds(0);
    tickAtRef.current = performance.now();
    fracRef.current = 0;
  };

  const handleAddTodayTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    dataService.addTodayTask(quickTaskTitle);
    setQuickTaskTitle('');
  };

  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNote.trim()) return;
    dataService.addQuickNote(quickNote);
    setQuickNote('');
  };

  const isBreak = mode !== 'Deep Work';
  const isPaused = !isRunning && sessionElapsedSeconds > 0;
  // Focus keeps the mint identity; breaks shift to the palette's warm amber.
  const dialAccent = isBreak ? '#f59e0b' : 'var(--accent-mint)';

  return (
    <div className="clockit-page-container">
      {/* 0. Mode Switch — the primary session control */}
      <div className="clockit-focus-mode-switch" role="tablist" aria-label="Focus mode">
        {(Object.keys(MODE_DURATIONS) as FocusMode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`clockit-focus-mode-btn${mode === m ? ' is-active' : ''}`}
            onClick={() => switchMode(m)}
          >
            {m}
          </button>
        ))}
      </div>

      {/* 1. Centered Focus Dial Timer — the primary visual element */}
      <section
        className={`clockit-focus-dial-container${isRunning ? ' is-running' : ''}${isBreak ? ' is-break' : ''}${isPaused ? ' is-paused' : ''}${isSwitching ? ' is-switching' : ''}`}
        aria-label="Circular Focus Timer"
      >
        {/* Task Selection Bar */}
        <div className="clockit-focus-target-row">
          <div className="clockit-focus-target-label">
            <Target size={14} color="var(--accent-mint)" />
            <span>Focus Target:</span>
          </div>
          <select
            className="clockit-sort-select clockit-focus-target-select"
            value={selectedTaskId || ''}
            onChange={(e) => handleSelectTask(e.target.value)}
            aria-label="Select Task to Focus"
          >
            <option value="">No specific task (General focus)</option>
            {tasks
              .filter((t) => !t.completed)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.workspace})
                </option>
              ))}
          </select>
        </div>

        <div className={`clockit-focus-dial-stage${justCompleted ? ' is-complete' : ''}`}>
          <svg className="clockit-dial-svg" viewBox="0 0 340 340" role="img" aria-label={`${mode} timer, ${formattedDigits} remaining`}>
            {/* Dial plate — a soft disc so the mechanism reads as an instrument */}
            <circle className="clockit-dial-plate" cx="170" cy="170" r="169" />

            {/* Bezel: 60 minute ticks, 12 heavier hour markers, heaviest on the quarters */}
            <g className="clockit-dial-ticks">
              {Array.from({ length: 60 }).map((_, index) => {
                const isCardinal = index % 15 === 0;
                const isHour = index % 5 === 0;
                const tickAngle = (index * 6 - 90) * (Math.PI / 180);
                const inner = isCardinal ? 151 : isHour ? 156 : 162;
                return (
                  <line
                    key={index}
                    x1={170 + inner * Math.cos(tickAngle)}
                    y1={170 + inner * Math.sin(tickAngle)}
                    x2={170 + 168 * Math.cos(tickAngle)}
                    y2={170 + 168 * Math.sin(tickAngle)}
                    className={
                      isCardinal
                        ? 'clockit-dial-tick is-cardinal'
                        : isHour
                          ? 'clockit-dial-tick is-hour'
                          : 'clockit-dial-tick'
                    }
                    strokeWidth={isCardinal ? 2.4 : isHour ? 1.9 : 1}
                    strokeLinecap="round"
                    opacity={isCardinal ? 0.9 : isHour ? 0.6 : 0.28}
                  />
                );
              })}
            </g>

            {/* Readout frame — gives the centre composition a dial plate to sit on */}
            <circle
              className="clockit-dial-inner-ring"
              cx="170"
              cy="170"
              r="98"
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />

            {/* Remaining-time track */}
            <circle
              className="clockit-dial-track"
              cx="170"
              cy="170"
              r={DIAL_RADIUS}
              fill="none"
              stroke="var(--border-strong)"
              strokeWidth="10"
              opacity="0.24"
            />

            {/* Remaining-time arc — drained clockwise by the frame loop */}
            <circle
              ref={arcRef}
              className="clockit-dial-progress"
              cx="170"
              cy="170"
              r={DIAL_RADIUS}
              fill="none"
              stroke={dialAccent}
              strokeWidth="10"
              strokeDasharray={DIAL_CIRCUMFERENCE}
              strokeLinecap="round"
            />

            {/* Completion ripple — one outward breath when a run finishes */}
            <circle
              className="clockit-dial-ripple"
              cx="170"
              cy="170"
              r={DIAL_RADIUS}
              stroke={dialAccent}
              strokeWidth="2.5"
            />

            {/* End-cap riding the head of the arc */}
            <g ref={capRef} className="clockit-dial-cap">
              <circle cx="170" cy={170 - DIAL_RADIUS} r="5.5" fill="var(--bg-surface)" stroke={dialAccent} strokeWidth="3" />
            </g>

            {/* Sweep needle — one quiet revolution per minute */}
            <g ref={sweepRef} className="clockit-dial-hand clockit-dial-sweep">
              <line x1="170" y1="70" x2="170" y2="42" stroke={dialAccent} strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="170" cy="42" r="2.6" fill={dialAccent} />
            </g>
          </svg>

          {/* Center Text Information */}
          <div key={mode} className="clockit-dial-center motion-fade-in">
            <div className="clockit-dial-status">
              <span
                className={`clockit-dial-status-dot${isRunning ? ' is-live' : ''}${
                  isPaused ? ' is-paused' : ''
                }`}
              />
              <span>{isPaused ? 'Paused' : isBreak ? 'Break' : 'Focus'}</span>
            </div>
            <div className="clockit-dial-digits">{formattedDigits}</div>
            <div className="clockit-dial-mode">{mode}</div>
            <div className="clockit-dial-elapsed">{formattedElapsed} elapsed</div>

            {selectedTask && <div className="clockit-dial-task">{selectedTask.title}</div>}
          </div>
        </div>

        {/* Side Stoic Quote */}
        <div className="clockit-focus-side-quote">“Consistency compounds.”</div>

        {/* 2. Control Pills Bar */}
        <div className="clockit-timer-controls-bar">
          <button
            className="clockit-timer-start-btn"
            onClick={handleStartPause}
            type="button"
          >
            {isRunning ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
            <span>{`${isRunning ? 'Pause' : 'Start'} ${isBreak ? 'Break' : 'Focus'}`}</span>
          </button>

          <button
            className="clockit-timer-icon-btn"
            onClick={handleResetSession}
            title="Reset / End Session"
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

          <button className="clockit-timer-icon-btn" title="Picture in Picture" type="button">
            <Maximize2 size={16} />
          </button>

          <button className="clockit-timer-icon-btn" title="Timer Settings" type="button">
            <Sliders size={16} />
          </button>
        </div>
      </section>

      {/* 3. Session Metrics Row (4 Cards) */}
      <section className="clockit-stats-grid-4" aria-label="Session Stats">
        <div className="clockit-stat-card">
          <div>
            <div className="clockit-stat-label">Session Time</div>
            <div className="clockit-stat-value">{focusStats.timeFocused}</div>
          </div>
          <Clock size={18} color="var(--accent-mint)" />
        </div>

        <div className="clockit-stat-card">
          <div>
            <div className="clockit-stat-label">Focus Blocks</div>
            <div className="clockit-stat-value">{focusStats.sessions} / 4</div>
          </div>
          <Crosshair size={18} color="var(--accent-mint)" />
        </div>

        <div className="clockit-stat-card">
          <div>
            <div className="clockit-stat-label">Break in</div>
            <div className="clockit-stat-value">{mode === 'Deep Work' ? formattedDigits : '--:--'}</div>
          </div>
          <Coffee size={18} color="var(--accent-mint)" />
        </div>

        <div className="clockit-stat-card">
          <div>
            <div className="clockit-stat-label">Today Focus</div>
            <div className="clockit-stat-value">{focusStats.deepWork}</div>
          </div>
          <BarChart3 size={18} color="var(--accent-mint)" />
        </div>
      </section>

      {/* 4. Bottom 2-Column Content */}
      <div className="clockit-focus-bottom-grid">
        {/* Left: Today Task Queue */}
        <div className="clockit-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <strong style={{ fontSize: 14.5, color: 'var(--text-primary)' }}>Today</strong>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {todayTasks.filter((t) => t.completed).length} / {todayTasks.length} done
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {todayTasks.map((task) => {
              const isSelected = selectedTaskId === task.id;
              return (
                <div
                  key={task.id}
                  className="clockit-task-row"
                  style={{
                    padding: '10px 8px',
                    borderRadius: 6,
                    background: isSelected ? 'var(--bg-surface-subtle)' : undefined,
                    borderLeft: isSelected ? '3px solid var(--accent-mint)' : undefined,
                  }}
                >
                  <div className="clockit-task-left">
                    <div
                      className={`clockit-task-checkbox ${task.completed ? 'checked' : ''}`}
                      onClick={() => toggleTask(task.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          toggleTask(task.id);
                        }
                      }}
                      role="checkbox"
                      aria-checked={task.completed}
                      aria-label={task.title}
                      tabIndex={0}
                      title={task.completed ? 'Reopen task' : 'Mark as complete'}
                    >
                      {task.completed && '✓'}
                    </div>
                    <span className={`clockit-task-title ${task.completed ? 'completed' : ''}`}>
                      {task.title}
                    </span>
                  </div>

                  <div className="clockit-task-right">
                    <button
                      type="button"
                      className="clockit-icon-action-btn"
                      style={{ padding: '2px 6px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={() => handleSelectTask(task.id)}
                      title="Set as Focus Target"
                    >
                      <Crosshair size={12} color={isSelected ? 'var(--accent-mint)' : 'var(--text-muted)'} />
                      <span style={{ color: isSelected ? 'var(--accent-mint)' : 'var(--text-muted)' }}>
                        {isSelected ? 'Active' : 'Focus'}
                      </span>
                    </button>

                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{task.deadline}</span>
                    <span className={`clockit-priority-badge ${task.priority}`}>{task.priority}</span>
                  </div>
                </div>
              );
            })}
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
        <div className="clockit-focus-side-stack">
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
                <button className="clockit-icon-action-btn" type="button">
                  <SkipBack size={15} />
                </button>
                <button
                  className="clockit-timer-icon-btn"
                  style={{ width: 32, height: 32, borderRadius: '50%' }}
                  onClick={() => setIsPlayingMusic(!isPlayingMusic)}
                  type="button"
                >
                  {isPlayingMusic ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                </button>
                <button className="clockit-icon-action-btn" type="button">
                  <SkipForward size={15} />
                </button>
                <button className="clockit-icon-action-btn" type="button">
                  <Volume2 size={15} />
                </button>
              </div>

              {/* Spotify Integration Badge */}
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  backgroundColor: '#1db954',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
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

      {/* Session Complete - Task Completion Prompt Modal */}
      {showSessionCompletePrompt && completedSessionDetails && (
        <div
          className="clockit-modal-scrim"
          onClick={() => setShowSessionCompletePrompt(false)}
        >
          <div
            className="clockit-card clockit-modal-panel"
            style={{ width: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="clockit-session-complete-badge" aria-hidden="true">
              <CircleCheckBig size={22} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <h3 style={{ fontSize: 17, margin: 0, color: 'var(--text-primary)' }}>Focus Session Logged</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
              Great job! You logged <strong>{completedSessionDetails.duration} minutes</strong> of focus on &ldquo;{completedSessionDetails.taskTitle}&rdquo;. Would you like to mark this task as completed?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="clockit-filter-pill"
                onClick={() => setShowSessionCompletePrompt(false)}
              >
                Keep In Progress
              </button>
              <button
                type="button"
                className="clockit-primary-btn"
                onClick={() => {
                  if (selectedTaskId) {
                    dataService.updateTask(selectedTaskId, { completed: true, status: 'completed' });
                  }
                  setShowSessionCompletePrompt(false);
                }}
              >
                Mark as Completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
