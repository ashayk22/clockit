import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Maximize2,
  Minimize2,
  Clock,
  Crosshair,
  Coffee,
  BarChart3,
  Plus,
  CircleCheckBig,
  X,
  Target,
  Check,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { selectFocusStats, selectTodayTasks } from '../../services/selectors';
import { TaskItem } from '../../data/mockData';
import { QuickNotesCard } from '../notes/QuickNotesCard';

type FocusMode = 'Deep Work' | 'Short Break' | 'Long Break';

interface TimerSettings {
  deepWork: number; // minutes
  shortBreak: number; // minutes
  longBreak: number; // minutes
}

const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  deepWork: 45,
  shortBreak: 15,
  longBreak: 20,
};

const TIMER_SETTINGS_KEY = 'clockit_timer_settings';
const ACTIVE_TIMER_KEY = 'clockit_active_timer_state';

function loadTimerSettings(): TimerSettings {
  try {
    const raw = localStorage.getItem(TIMER_SETTINGS_KEY);
    if (!raw) return DEFAULT_TIMER_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      deepWork: typeof parsed.deepWork === 'number' && parsed.deepWork > 0 ? parsed.deepWork : 45,
      shortBreak: typeof parsed.shortBreak === 'number' && parsed.shortBreak > 0 ? parsed.shortBreak : 15,
      longBreak: typeof parsed.longBreak === 'number' && parsed.longBreak > 0 ? parsed.longBreak : 20,
    };
  } catch {
    return DEFAULT_TIMER_SETTINGS;
  }
}

function saveTimerSettings(settings: TimerSettings): void {
  try {
    localStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable */
  }
}

function getModeDurationSeconds(settings: TimerSettings, targetMode: FocusMode): number {
  if (targetMode === 'Deep Work') return settings.deepWork * 60;
  if (targetMode === 'Short Break') return settings.shortBreak * 60;
  return settings.longBreak * 60;
}

/* Dial geometry — the annulus the remaining-time mechanism rides on. */
const DIAL_RADIUS = 140;
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;

interface FocusPageProps {
  workspaceName?: string;
}

export const FocusPage: React.FC<FocusPageProps> = ({ workspaceName }) => {
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
    return (
      tasks.find(
        (task) => task.id === selectedTaskId && (!workspaceName || task.workspace === workspaceName),
      ) || null
    );
  }, [tasks, selectedTaskId, workspaceName]);

  const focusTasks = useMemo(
    () => (workspaceName ? tasks.filter((task) => task.workspace === workspaceName) : tasks),
    [tasks, workspaceName],
  );

  // Timer Configuration State
  const [timerSettings, setTimerSettings] = useState<TimerSettings>(() => loadTimerSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState<TimerSettings>(() => loadTimerSettings());
  const [isExpandedView, setIsExpandedView] = useState(false);

  // Active Timer State with browser recovery
  const initialSaved = useMemo(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_TIMER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const mode: FocusMode = ['Deep Work', 'Short Break', 'Long Break'].includes(parsed?.mode)
        ? parsed.mode
        : 'Deep Work';
      const duration = getModeDurationSeconds(loadTimerSettings(), mode);

      if (parsed?.isRunning && typeof parsed?.targetEndTime === 'number') {
        const now = Date.now();
        const rem = Math.max(0, Math.ceil((parsed.targetEndTime - now) / 1000));
        const elapsed = Math.max(0, Math.floor((now - (parsed.startedAt || now)) / 1000));
        if (rem > 0) {
          return { mode, secondsLeft: rem, sessionElapsedSeconds: elapsed, isRunning: true, targetEndTime: parsed.targetEndTime, startedAt: parsed.startedAt };
        }
      } else if (typeof parsed?.secondsLeft === 'number') {
        return {
          mode,
          secondsLeft: parsed.secondsLeft,
          sessionElapsedSeconds: parsed.sessionElapsedSeconds || 0,
          isRunning: false,
          targetEndTime: null,
          startedAt: null,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const [mode, setMode] = useState<FocusMode>(() => initialSaved?.mode || 'Deep Work');
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    initialSaved?.secondsLeft !== undefined ? initialSaved.secondsLeft : getModeDurationSeconds(loadTimerSettings(), 'Deep Work')
  );
  const [isRunning, setIsRunning] = useState<boolean>(() => Boolean(initialSaved?.isRunning));
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState<number>(() => initialSaved?.sessionElapsedSeconds || 0);

  // Wall-clock refs to completely eliminate timer drift
  const targetEndTimeRef = useRef<number | null>(initialSaved?.targetEndTime || null);
  const startedAtRef = useRef<number>(initialSaved?.startedAt || Date.now());

  // Completion modal/prompt state
  const [showSessionCompletePrompt, setShowSessionCompletePrompt] = useState(false);
  const [completedSessionDetails, setCompletedSessionDetails] = useState<{ duration: number; taskTitle: string } | null>(null);

  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // Brief non-blocking completion feedback for dial
  const [justCompleted, setJustCompleted] = useState(false);
  const completionTimerRef = useRef<number | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const switchTimerRef = useRef<number | null>(null);

  // Dial continuous mechanism refs
  const arcRef = useRef<SVGCircleElement | null>(null);
  const capRef = useRef<SVGGElement | null>(null);
  const sweepRef = useRef<SVGGElement | null>(null);
  const expandedArcRef = useRef<SVGCircleElement | null>(null);
  const expandedCapRef = useRef<SVGGElement | null>(null);
  const expandedSweepRef = useRef<SVGGElement | null>(null);

  const tickAtRef = useRef<number>(performance.now());
  const fracRef = useRef<number>(0);
  const modeRef = useRef(mode);
  const secondsRef = useRef(secondsLeft);
  const elapsedRef = useRef(sessionElapsedSeconds);
  const runningRef = useRef(isRunning);

  modeRef.current = mode;
  secondsRef.current = secondsLeft;
  elapsedRef.current = sessionElapsedSeconds;
  runningRef.current = isRunning;

  // Persist timer state to survive browser reload
  useEffect(() => {
    try {
      localStorage.setItem(
        ACTIVE_TIMER_KEY,
        JSON.stringify({
          mode,
          secondsLeft,
          sessionElapsedSeconds,
          isRunning,
          targetEndTime: targetEndTimeRef.current,
          startedAt: startedAtRef.current,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [mode, secondsLeft, sessionElapsedSeconds, isRunning]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (completionTimerRef.current) window.clearTimeout(completionTimerRef.current);
      if (switchTimerRef.current) window.clearTimeout(switchTimerRef.current);
    };
  }, []);

  // Keyboard shortcut: Space toggles timer, Escape closes expanded view or settings
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleStartPause();
      } else if (e.key === 'Escape') {
        if (isExpandedView) setIsExpandedView(false);
        if (isSettingsOpen) setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const todayTasks = useMemo(() => selectTodayTasks(focusTasks), [focusTasks]);

  const focusStats = useMemo(() => {
    if (!workspaceName) return dataService.getFocusStats();
    const workspaceTaskIds = new Set(focusTasks.map((task) => task.id));
    return selectFocusStats(
      dataService
        .getFocusSessions()
        .filter((session) => session.taskId && workspaceTaskIds.has(session.taskId)),
    );
  }, [focusTasks, tasks, workspaceName]);

  // Handle session completion
  const handleCompleteSession = () => {
    const total = getModeDurationSeconds(timerSettings, mode);
    const durationMins = Math.max(1, Math.round((total - secondsLeft) / 60));

    setIsRunning(false);
    targetEndTimeRef.current = null;

    dataService.recordFocusSession({
      taskId: selectedTaskId,
      taskTitle: selectedTask?.title,
      mode,
      durationMinutes: durationMins,
    });

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

    const nextDuration = getModeDurationSeconds(timerSettings, mode);
    setSecondsLeft(nextDuration);
    setSessionElapsedSeconds(0);
    tickAtRef.current = performance.now();
    fracRef.current = 0;
  };

  // Accurate drift-free countdown loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      if (!targetEndTimeRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
      const elapsed = Math.max(0, Math.floor((now - startedAtRef.current) / 1000));

      tickAtRef.current = performance.now();
      setSecondsLeft(remaining);
      setSessionElapsedSeconds(elapsed);

      if (remaining <= 0) {
        window.clearInterval(interval);
        handleCompleteSession();
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isRunning, mode, timerSettings]);

  // RequestAnimationFrame loop for continuous smooth sweep of dial
  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let frame = 0;
    const draw = () => {
      const arcList = [arcRef.current, expandedArcRef.current].filter(Boolean) as SVGCircleElement[];
      const capList = [capRef.current, expandedCapRef.current].filter(Boolean) as SVGGElement[];
      const needleList = [sweepRef.current, expandedSweepRef.current].filter(Boolean) as SVGGElement[];

      if (arcList.length > 0) {
        let frac = 0;
        if (runningRef.current && !reduced) {
          frac = Math.min(1, Math.max(0, (performance.now() - tickAtRef.current) / 1000));
          fracRef.current = frac;
        } else if (!reduced) {
          frac = fracRef.current;
        }

        const total = getModeDurationSeconds(timerSettings, modeRef.current);
        const remaining = Math.max(0, secondsRef.current - frac);
        const ratio = Math.min(1, remaining / total);
        const consumed = (1 - ratio) * 360;

        for (const arc of arcList) {
          arc.style.strokeDashoffset = String(DIAL_CIRCUMFERENCE * (1 - ratio));
          arc.style.transform = `rotate(${consumed - 90}deg)`;
        }
        for (const cap of capList) {
          cap.style.transform = `rotate(${consumed}deg)`;
        }
        for (const needle of needleList) {
          needle.style.transform = `rotate(${(elapsedRef.current + frac) * 6}deg)`;
        }
      }
      frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, [timerSettings]);

  const toggleTask = (id: string) => {
    dataService.toggleTask(id);
  };

  const handleSelectTask = (taskId: string) => {
    dataService.setSelectedFocusTaskId(taskId);
  };

  /** Mode change: restores the configured duration for the chosen mode. */
  const switchMode = (next: FocusMode) => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setMode(next);
    const duration = getModeDurationSeconds(timerSettings, next);
    setSecondsLeft(duration);
    setSessionElapsedSeconds(0);
    tickAtRef.current = performance.now();
    fracRef.current = 0;

    setIsSwitching(false);
    window.requestAnimationFrame(() => setIsSwitching(true));
    if (switchTimerRef.current) window.clearTimeout(switchTimerRef.current);
    switchTimerRef.current = window.setTimeout(() => setIsSwitching(false), 520);
  };

  /** Start / Pause / Resume with zero drift. */
  const handleStartPause = () => {
    if (!isRunning) {
      const now = Date.now();
      targetEndTimeRef.current = now + secondsLeft * 1000;
      startedAtRef.current = now - sessionElapsedSeconds * 1000;
      tickAtRef.current = performance.now();
      setIsRunning(true);
    } else {
      setIsRunning(false);
      targetEndTimeRef.current = null;
    }
  };

  /** Reset: stops timer and restores the mode's configured duration. */
  const handleResetSession = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    const duration = getModeDurationSeconds(timerSettings, mode);
    setSecondsLeft(duration);
    setSessionElapsedSeconds(0);
    tickAtRef.current = performance.now();
    fracRef.current = 0;
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveTimerSettings(settingsForm);
    setTimerSettings(settingsForm);

    if (!isRunning) {
      const updatedDuration = getModeDurationSeconds(settingsForm, mode);
      setSecondsLeft(updatedDuration);
    }
    setIsSettingsOpen(false);
  };

  const handleAddTodayTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    if (workspaceName) {
      dataService.addTask({
        title: quickTaskTitle,
        workspace: workspaceName,
        isToday: true,
      });
    } else {
      dataService.addTodayTask(quickTaskTitle);
    }
    setQuickTaskTitle('');
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedDigits = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const elapsedMins = Math.floor(sessionElapsedSeconds / 60);
  const elapsedSecs = sessionElapsedSeconds % 60;
  const formattedElapsed = `${String(elapsedMins).padStart(2, '0')}:${String(elapsedSecs).padStart(2, '0')}`;

  const isBreak = mode !== 'Deep Work';
  const isPaused = !isRunning && sessionElapsedSeconds > 0;
  const dialAccent = isBreak ? '#f59e0b' : 'var(--accent-mint)';

  // Reusable Dial SVG renderer
  const renderDialSvg = (isExp = false) => (
    <svg className="clockit-dial-svg" viewBox="0 0 340 340" role="img" aria-label={`${mode} timer, ${formattedDigits} remaining`}>
      <circle className="clockit-dial-plate" cx="170" cy="170" r="169" />
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
      <circle className="clockit-dial-inner-ring" cx="170" cy="170" r="98" fill="none" stroke="var(--border-subtle)" strokeWidth="1" />
      <circle className="clockit-dial-track" cx="170" cy="170" r={DIAL_RADIUS} fill="none" stroke="var(--border-strong)" strokeWidth="10" opacity="0.24" />
      <circle
        ref={isExp ? expandedArcRef : arcRef}
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
      <circle className="clockit-dial-ripple" cx="170" cy="170" r={DIAL_RADIUS} stroke={dialAccent} strokeWidth="2.5" />
      <g ref={isExp ? expandedCapRef : capRef} className="clockit-dial-cap">
        <circle cx="170" cy={170 - DIAL_RADIUS} r="5.5" fill="var(--bg-surface)" stroke={dialAccent} strokeWidth="3" />
      </g>
      <g ref={isExp ? expandedSweepRef : sweepRef} className="clockit-dial-hand clockit-dial-sweep">
        <line x1="170" y1="70" x2="170" y2="42" stroke={dialAccent} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="170" cy="42" r="2.6" fill={dialAccent} />
      </g>
    </svg>
  );

  return (
    <div className="clockit-page-container">
      {/* 0. Mode Switch — the primary session control */}
      <div className="clockit-focus-mode-switch" role="tablist" aria-label="Focus mode">
        {(['Deep Work', 'Short Break', 'Long Break'] as FocusMode[]).map((m) => (
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

      {/* 1. Centered Focus Dial Timer */}
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
            {focusTasks
              .filter((t) => !t.completed)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.workspace})
                </option>
              ))}
          </select>
        </div>

        <div className={`clockit-focus-dial-stage${justCompleted ? ' is-complete' : ''}`}>
          {renderDialSvg(false)}

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
            title={isRunning ? 'Pause timer (Space)' : 'Start timer (Space)'}
          >
            {isRunning ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
            <span>{`${isRunning ? 'Pause' : 'Start'} ${isBreak ? 'Break' : 'Focus'}`}</span>
          </button>

          <button
            className="clockit-timer-icon-btn"
            onClick={handleResetSession}
            title="Reset to Configured Duration"
            type="button"
          >
            <RotateCcw size={16} />
          </button>

          <button
            className="clockit-timer-icon-btn"
            onClick={() => setIsExpandedView(true)}
            title="Expand Zen View"
            type="button"
          >
            <Maximize2 size={16} />
          </button>

          <button
            className="clockit-timer-icon-btn"
            onClick={() => {
              setSettingsForm(timerSettings);
              setIsSettingsOpen(true);
            }}
            title="Timer Settings"
            type="button"
          >
            <Sliders size={16} />
          </button>
        </div>
      </section>

      {/* 3. Session Metrics Row */}
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
              placeholder={workspaceName ? `Add task to ${workspaceName}` : 'Add quick task'}
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              aria-label="Add quick task"
            />
          </form>
        </div>

        {/* Right Stack: Quick Notes with full expanded capabilities */}
        <div className="clockit-focus-side-stack">
          <QuickNotesCard maxVisibleNotes={5} />
        </div>
      </div>

      {/* Expanded Zen Mode Overlay */}
      {isExpandedView && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-primary)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ position: 'absolute', top: 20, right: 24, display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="clockit-icon-action-btn"
              onClick={() => setIsExpandedView(false)}
              title="Close Expanded View (Esc)"
              style={{ width: 36, height: 36, borderRadius: '50%' }}
            >
              <Minimize2 size={18} />
            </button>
          </div>

          {/* Mode Switch in Expanded View */}
          <div className="clockit-focus-mode-switch" role="tablist" style={{ marginBottom: 24 }}>
            {(['Deep Work', 'Short Break', 'Long Break'] as FocusMode[]).map((m) => (
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

          {/* Dial Stage */}
          <div className={`clockit-focus-dial-container${isRunning ? ' is-running' : ''}${isBreak ? ' is-break' : ''}${isPaused ? ' is-paused' : ''}`}>
            <div className={`clockit-focus-dial-stage${justCompleted ? ' is-complete' : ''}`} style={{ transform: 'scale(1.15)', margin: '20px 0' }}>
              {renderDialSvg(true)}
              <div key={mode} className="clockit-dial-center">
                <div className="clockit-dial-status">
                  <span className={`clockit-dial-status-dot${isRunning ? ' is-live' : ''}${isPaused ? ' is-paused' : ''}`} />
                  <span>{isPaused ? 'Paused' : isBreak ? 'Break' : 'Focus'}</span>
                </div>
                <div className="clockit-dial-digits">{formattedDigits}</div>
                <div className="clockit-dial-mode">{mode}</div>
                <div className="clockit-dial-elapsed">{formattedElapsed} elapsed</div>
                {selectedTask && <div className="clockit-dial-task">{selectedTask.title}</div>}
              </div>
            </div>

            {/* Controls Bar in Expanded View */}
            <div className="clockit-timer-controls-bar" style={{ marginTop: 24 }}>
              <button
                className="clockit-timer-start-btn"
                onClick={handleStartPause}
                type="button"
                style={{ padding: '10px 28px', fontSize: 15 }}
              >
                {isRunning ? <Pause size={19} /> : <Play size={19} fill="currentColor" />}
                <span>{`${isRunning ? 'Pause' : 'Start'} ${isBreak ? 'Break' : 'Focus'}`}</span>
              </button>
              <button
                className="clockit-timer-icon-btn"
                onClick={handleResetSession}
                title="Reset Duration"
                type="button"
              >
                <RotateCcw size={17} />
              </button>
              <button
                className="clockit-timer-icon-btn"
                onClick={() => {
                  setSettingsForm(timerSettings);
                  setIsSettingsOpen(true);
                }}
                title="Timer Settings"
                type="button"
              >
                <Sliders size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timer Settings Modal */}
      {isSettingsOpen && (
        <div className="clockit-modal-scrim" onClick={() => setIsSettingsOpen(false)}>
          <div
            className="clockit-card clockit-modal-panel"
            style={{ width: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 650, color: 'var(--text-primary)' }}>Timer Settings</h3>
              <button
                type="button"
                className="clockit-icon-action-btn"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 550, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Deep Work Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  className="clockit-input"
                  value={settingsForm.deepWork}
                  onChange={(e) => setSettingsForm({ ...settingsForm, deepWork: Number(e.target.value) || 1 })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 550, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Short Break Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  className="clockit-input"
                  value={settingsForm.shortBreak}
                  onChange={(e) => setSettingsForm({ ...settingsForm, shortBreak: Number(e.target.value) || 1 })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 550, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Long Break Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  className="clockit-input"
                  value={settingsForm.longBreak}
                  onChange={(e) => setSettingsForm({ ...settingsForm, longBreak: Number(e.target.value) || 1 })}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="clockit-filter-pill"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="clockit-primary-btn">
                  <Check size={14} />
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default FocusPage;
