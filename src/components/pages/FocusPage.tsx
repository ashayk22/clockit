import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CircleCheckBig,
  X,
  Check,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { TaskItem } from '../../data/mockData';
import { FocusWorkspacePresentation } from '../focus/FocusWorkspacePresentation';
import { scopedStorageKey } from '../../services/repositories/storage';

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
    const raw = localStorage.getItem(scopedStorageKey(TIMER_SETTINGS_KEY));
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
    localStorage.setItem(scopedStorageKey(TIMER_SETTINGS_KEY), JSON.stringify(settings));
  } catch {
    /* storage unavailable */
  }
}

function getModeDurationSeconds(settings: TimerSettings, targetMode: FocusMode): number {
  if (targetMode === 'Deep Work') return settings.deepWork * 60;
  if (targetMode === 'Short Break') return settings.shortBreak * 60;
  return settings.longBreak * 60;
}

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

  // Active Timer State with browser recovery
  const initialSaved = useMemo(() => {
    try {
      const raw = localStorage.getItem(scopedStorageKey(ACTIVE_TIMER_KEY));
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

  // Persist timer state to survive browser reload
  useEffect(() => {
    try {
      localStorage.setItem(
        scopedStorageKey(ACTIVE_TIMER_KEY),
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

  // Keyboard shortcut: Space toggles the timer; Escape closes timer settings.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleStartPause();
      } else if (e.key === 'Escape') {
        if (isSettingsOpen) setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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
  };

  // Accurate drift-free countdown loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      if (!targetEndTimeRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
      const elapsed = Math.max(0, Math.floor((now - startedAtRef.current) / 1000));

      setSecondsLeft(remaining);
      setSessionElapsedSeconds(elapsed);

      if (remaining <= 0) {
        window.clearInterval(interval);
        handleCompleteSession();
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isRunning, mode, timerSettings]);

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
  };

  /** Start / Pause / Resume with zero drift. */
  const handleStartPause = () => {
    if (!isRunning) {
      const now = Date.now();
      targetEndTimeRef.current = now + secondsLeft * 1000;
      startedAtRef.current = now - sessionElapsedSeconds * 1000;
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

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedDigits = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const elapsedMins = Math.floor(sessionElapsedSeconds / 60);
  const elapsedSecs = sessionElapsedSeconds % 60;
  const formattedElapsed = `${String(elapsedMins).padStart(2, '0')}:${String(elapsedSecs).padStart(2, '0')}`;

  const isPaused = !isRunning && sessionElapsedSeconds > 0;

  return (
    <div className="clockit-page-container clockit-focus-shell">
      <FocusWorkspacePresentation
        mode={mode}
        timerText={formattedDigits}
        elapsedText={formattedElapsed}
        isRunning={isRunning}
        isPaused={isPaused}
        progress={Math.min(1, Math.max(0, 1 - secondsLeft / getModeDurationSeconds(timerSettings, mode)))}
        selectedTaskTitle={selectedTask?.title}
        taskSelector={(
          <label className="focus-target-control">
            <span>Focus target</span>
            <select
              value={selectedTaskId || ''}
              onChange={(event) => handleSelectTask(event.target.value)}
              aria-label="Select task for focus session"
            >
              <option value="">General focus</option>
              {focusTasks.filter((task) => !task.completed).map((task) => (
                <option key={task.id} value={task.id}>{task.title} · {task.workspace}</option>
              ))}
            </select>
          </label>
        )}
        settings={timerSettings}
        onModeChange={switchMode}
        onStartPause={handleStartPause}
        onReset={handleResetSession}
        onNext={() => switchMode(mode === 'Short Break' ? 'Deep Work' : 'Short Break')}
        onSettings={() => {
          setSettingsForm(timerSettings);
          setIsSettingsOpen(true);
        }}
      />

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
