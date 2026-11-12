import React, { useEffect, useState } from 'react';
import {
  Bold, CheckSquare, Clock3, Coffee, Italic, Layers2, List, Maximize2,
  Minimize2, Pause, Play, RotateCcw, Settings2, SkipForward,
  Underline, Link2,
} from 'lucide-react';
import { ClockItLogo } from '../brand/ClockItLogo';
import { FocusClockDisplay, type FocusClockMode } from './FocusClockDisplay';
import './focus-workspace.css';

export type FocusSessionMode = 'Deep Work' | 'Short Break' | 'Long Break';

interface FocusWorkspacePresentationProps {
  mode: FocusSessionMode;
  timerText: string;
  elapsedText: string;
  isRunning: boolean;
  isPaused: boolean;
  progress: number;
  selectedTaskTitle?: string;
  taskSelector: React.ReactNode;
  settings: { deepWork: number; shortBreak: number; longBreak: number };
  onModeChange: (mode: FocusSessionMode) => void;
  onStartPause: () => void;
  onReset: () => void;
  onNext: () => void;
  onSettings: () => void;
}

const SESSION_MODES: FocusSessionMode[] = ['Deep Work', 'Short Break', 'Long Break'];

export const FocusWorkspacePresentation: React.FC<FocusWorkspacePresentationProps> = ({
  mode,
  timerText,
  elapsedText,
  isRunning,
  isPaused,
  progress,
  selectedTaskTitle,
  taskSelector,
  settings,
  onModeChange,
  onStartPause,
  onReset,
  onNext,
  onSettings,
}) => {
  const [clockMode, setClockMode] = useState<FocusClockMode>('analog');
  const [showSeconds, setShowSeconds] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded]);

  return (
    <div className={`focus-workspace${expanded ? ' is-expanded' : ''}`}>
      <header className="focus-workspace-header">
        <div className="focus-workspace-brand">
          <ClockItLogo size={34} />
          <span className="focus-brand-divider" />
          <span className="focus-workspace-title">Focus Workspace</span>
        </div>

        <div className="focus-clock-mode-switch" role="group" aria-label="Clock display mode">
          <button type="button" className={clockMode === 'analog' ? 'is-active' : ''} aria-pressed={clockMode === 'analog'} onClick={() => setClockMode('analog')}>
            <Clock3 size={17} /> Analog
          </button>
          <button type="button" className={clockMode === 'digital' ? 'is-active' : ''} aria-pressed={clockMode === 'digital'} onClick={() => setClockMode('digital')}>
            <span className="focus-digital-icon">88</span> Digital
          </button>
        </div>

        <div className="focus-workspace-actions">
          {clockMode === 'digital' && (
            <button type="button" className={`focus-utility-button${showSeconds ? ' is-selected' : ''}`} onClick={() => setShowSeconds((value) => !value)} aria-pressed={showSeconds} aria-label={`${showSeconds ? 'Hide' : 'Show'} seconds`} title={`${showSeconds ? 'Hide' : 'Show'} seconds`}>
              <span className="focus-seconds-label">:SS</span>
            </button>
          )}
          <button type="button" className="focus-utility-button" aria-label="Timer settings" title="Timer settings" onClick={onSettings}><Settings2 size={19} /></button>
          <button type="button" className="focus-utility-button" aria-label={expanded ? 'Exit expanded workspace' : 'Expand workspace'} title={expanded ? 'Exit expanded workspace' : 'Expand workspace'} onClick={() => setExpanded((value) => !value)}>
            {expanded ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
          </button>
        </div>
      </header>

      <main className="focus-workspace-main">
        <section className={`focus-clock-pane${clockMode === 'digital' ? ' is-digital' : ''}`} aria-label="Current time">
          <FocusClockDisplay mode={clockMode} showSeconds={showSeconds} progress={progress} />
        </section>

        <section className={`focus-session-pane${isRunning ? ' is-running' : ''}`} aria-label="Focus session timer">
          <div className="focus-session-eyebrow"><span />Focus Session<span /></div>
          <div className="focus-countdown" aria-live="off">{timerText}</div>
          <div className="focus-session-kind">{mode}</div>
          <div className="focus-session-status">{isRunning ? 'Session in progress' : isPaused ? 'Paused' : 'Ready when you are'}</div>
          <div className="focus-mode-picker" role="group" aria-label="Focus session type">
            {SESSION_MODES.map((sessionMode) => (
              <button key={sessionMode} type="button" className={mode === sessionMode ? 'is-active' : ''} aria-pressed={mode === sessionMode} onClick={() => onModeChange(sessionMode)}>
                {sessionMode === 'Deep Work' ? 'Focus' : sessionMode === 'Short Break' ? 'Short break' : 'Long break'}
              </button>
            ))}
          </div>

          <div className="focus-playback-controls">
            <button type="button" className="focus-round-control" onClick={onReset} title="Reset session" aria-label="Reset session"><RotateCcw size={19} /></button>
            <button type="button" className="focus-primary-control" onClick={onStartPause} title={isRunning ? 'Pause session' : 'Start session'} aria-label={isRunning ? 'Pause session' : 'Start session'}>
              {isRunning ? <Pause size={25} fill="currentColor" /> : <Play size={27} fill="currentColor" />}
            </button>
            <button type="button" className="focus-round-control" onClick={onNext} title="Next session" aria-label="Next session"><SkipForward size={20} /></button>
          </div>
          <div className="focus-elapsed-readout">{elapsedText} elapsed</div>
          {taskSelector}
          {selectedTaskTitle && <div className="focus-selected-task">Working on <strong>{selectedTaskTitle}</strong></div>}
        </section>

        <aside className="focus-notes-panel" aria-label="Session notes preview">
          <div className="focus-notes-header">
            <div className="focus-notes-tabs">
              <span className="focus-notes-tab is-active"><Italic size={16} /> Notes</span>
              <span className="focus-notes-tab"><Layers2 size={17} /> Session Notes</span>
            </div>
            <button type="button" className="focus-notes-more" aria-label="Notes options" title="Notes options" disabled>•••</button>
          </div>
          <div className="focus-notes-toolbar" role="toolbar" aria-label="Formatting preview (not connected)">
            <button type="button" disabled aria-label="Bold preview"><Bold size={17} /></button>
            <button type="button" disabled aria-label="Italic preview"><Italic size={17} /></button>
            <button type="button" disabled aria-label="Underline preview"><Underline size={17} /></button>
            <span />
            <button type="button" disabled aria-label="Checklist preview"><CheckSquare size={17} /></button>
            <button type="button" disabled aria-label="List preview"><List size={18} /></button>
            <button type="button" disabled aria-label="Link preview"><Link2 size={17} /></button>
          </div>
          <div className="focus-notes-content" role="textbox" aria-readonly="true" aria-label="Notes editor preview">
            <span className="focus-notes-caret" />
            <span className="focus-notes-placeholder">Session notes preview — editing is not connected.</span>
          </div>
          <div className="focus-notes-footer"><span>Visual preview only</span><span>0 words</span></div>
        </aside>
      </main>

      <footer className="focus-session-config" aria-label="Session configuration">
        <button type="button" onClick={onSettings}>
          <span className="focus-config-icon"><Clock3 size={21} /></span>
          <span><small>Session</small><strong>{settings.deepWork} min</strong></span>
          <span className="focus-config-chevron">⌄</span>
        </button>
        <span className="focus-config-divider" />
        <button type="button" onClick={onSettings}>
          <span className="focus-config-icon"><Coffee size={21} /></span>
          <span><small>Short break</small><strong>{settings.shortBreak} min</strong></span>
          <span className="focus-config-chevron">⌄</span>
        </button>
        <span className="focus-config-divider" />
        <button type="button" onClick={onSettings}>
          <span className="focus-config-icon"><RotateCcw size={21} /></span>
          <span><small>Long break</small><strong>{settings.longBreak} min</strong></span>
          <span className="focus-config-chevron">⌄</span>
        </button>
      </footer>
    </div>
  );
};

export default FocusWorkspacePresentation;
