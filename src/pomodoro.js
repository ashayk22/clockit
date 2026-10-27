/**
 * ClockIt Pomodoro Timer Engine & UI Controller
 * 
 * Features:
 * - High-precision countdown based on actual timestamps (Date.now())
 * - Resilient to tab backgrounding, sleep, and visibility changes
 * - Focus, Short Break, Long Break, and Custom duration modes
 * - Smooth circular SVG progress ring interpolation
 * - Subtle mountain landscape with sun & cloud parallax
 * - Soothing Web Audio API harmonic chime on completion (zero dependencies)
 * - Browser Web Notifications API integration
 * - Completed sessions streak tracking in localStorage
 * - Seamless two-way synchronization between Full Pomodoro View and Dashboard Summary Card
 * - Full respect for prefers-reduced-motion
 */

import { gsap } from 'gsap';

// Default durations in seconds
export const DEFAULT_DURATIONS = {
  focus: 25 * 60,       // 25 minutes
  shortBreak: 5 * 60,   // 5 minutes
  longBreak: 15 * 60,   // 15 minutes
  custom: 30 * 60       // 30 minutes
};

const STORAGE_KEYS = {
  DURATIONS: 'clockit_pomodoro_durations',
  SESSIONS: 'clockit_pomodoro_completed_sessions',
  TODAY: 'clockit_pomodoro_today_count',
  DATE: 'clockit_pomodoro_today_date',
  SOUND: 'clockit_pomodoro_sound_enabled',
  NOTIFS: 'clockit_pomodoro_notifs_enabled'
};

const RING_CIRCUMFERENCE = 992.74; // 2 * Math.PI * 158
const MINI_RING_CIRCUMFERENCE = 125.66; // 2 * Math.PI * 20

/**
 * Web Audio API synthesized soothing singing bowl / focus chime.
 * Generates an organic harmonic chord: fundamental ~528Hz (Focus) + 1056Hz + 264Hz warm sub.
 */
function playHarmonicChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.25, now + 0.05);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
    masterGain.connect(ctx.destination);

    // Warm fundamental (528 Hz - Solfeggio focus frequency)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(528, now);
    osc1.frequency.exponentialRampToValueAtTime(524, now + 3.0);
    osc1.connect(masterGain);

    // High shimmer harmonic (1056 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.12, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1056, now);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    // Soft warm octave body (264 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0.15, now);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(264, now);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + 3.4);
    osc2.stop(now + 2.4);
    osc3.stop(now + 3.0);
  } catch (err) {
    console.warn('[Pomodoro] AudioContext error:', err);
  }
}

function getStorage(key, fallback = null) {
  try {
    if (typeof localStorage !== 'undefined') {
      const v = localStorage.getItem(key);
      return v !== null ? v : fallback;
    }
  } catch {}
  return fallback;
}

function setStorage(key, val) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, String(val));
    }
  } catch {}
}

/**
 * Authoritative Pomodoro State Machine
 */
export class PomodoroEngine {
  constructor() {
    this.durations = this.loadDurations();
    this.mode = 'focus'; // 'focus' | 'shortBreak' | 'longBreak' | 'custom'
    this.state = 'idle'; // 'idle' | 'running' | 'paused' | 'completed'
    this.totalDurationMs = this.durations.focus * 1000;
    this.remainingMs = this.totalDurationMs;
    this.endTime = null;
    this.cycleSession = 1; // 1 to 4
    this.cycleLength = 4;
    this.soundEnabled = getStorage(STORAGE_KEYS.SOUND) !== 'false';
    this.notifsEnabled = getStorage(STORAGE_KEYS.NOTIFS) === 'true';
    this.listeners = new Set();
    this.animFrame = null;
    this.lastSec = null;

    // Load sessions completed
    this.completedTotal = parseInt(getStorage(STORAGE_KEYS.SESSIONS, '0'), 10);
    this.checkDayRoll();

    // Visibility listener: handle tab switches without drift
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.state === 'running') {
          this.syncWithTimestamp();
        }
      });
    }
  }

  loadDurations() {
    try {
      const stored = getStorage(STORAGE_KEYS.DURATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          focus: Number(parsed.focus) || DEFAULT_DURATIONS.focus,
          shortBreak: Number(parsed.shortBreak) || DEFAULT_DURATIONS.shortBreak,
          longBreak: Number(parsed.longBreak) || DEFAULT_DURATIONS.longBreak,
          custom: Number(parsed.custom) || DEFAULT_DURATIONS.custom
        };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_DURATIONS };
  }

  saveDurations(newDurations) {
    this.durations = { ...this.durations, ...newDurations };
    setStorage(STORAGE_KEYS.DURATIONS, JSON.stringify(this.durations));
    if (this.state === 'idle' || this.state === 'completed') {
      this.totalDurationMs = (this.durations[this.mode] || DEFAULT_DURATIONS.focus) * 1000;
      this.remainingMs = this.totalDurationMs;
      this.notify();
    }
  }

  checkDayRoll() {
    const todayStr = new Date().toDateString();
    const storedDate = getStorage(STORAGE_KEYS.DATE);
    if (storedDate !== todayStr) {
      setStorage(STORAGE_KEYS.DATE, todayStr);
      setStorage(STORAGE_KEYS.TODAY, '0');
      this.completedToday = 0;
    } else {
      this.completedToday = parseInt(getStorage(STORAGE_KEYS.TODAY, '0'), 10);
    }
  }

  addListener(fn) {
    this.listeners.add(fn);
    fn(this.getSnapshot());
  }

  removeListener(fn) {
    this.listeners.delete(fn);
  }

  notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach(fn => fn(snapshot));
  }

  getSnapshot() {
    const totalSec = Math.ceil(this.remainingMs / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    const progress = Math.min(1, Math.max(0, 1 - (this.remainingMs / this.totalDurationMs)));

    return {
      mode: this.mode,
      state: this.state,
      remainingMs: this.remainingMs,
      totalDurationMs: this.totalDurationMs,
      progress,
      formattedTime: `${m} : ${s}`,
      rawTime: `${m}:${s}`,
      minutes: m,
      seconds: s,
      cycleSession: this.cycleSession,
      cycleLength: this.cycleLength,
      completedToday: this.completedToday,
      completedTotal: this.completedTotal,
      soundEnabled: this.soundEnabled,
      notifsEnabled: this.notifsEnabled
    };
  }

  start() {
    if (this.state === 'running') return;
    this.state = 'running';
    this.endTime = Date.now() + this.remainingMs;
    this.loop();
    this.notify();
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    if (this.endTime) {
      this.remainingMs = Math.max(0, this.endTime - Date.now());
    }
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    this.notify();
  }

  toggle() {
    if (this.state === 'running') {
      this.pause();
    } else {
      this.start();
    }
  }

  reset() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    this.state = 'idle';
    this.totalDurationMs = (this.durations[this.mode] || DEFAULT_DURATIONS.focus) * 1000;
    this.remainingMs = this.totalDurationMs;
    this.endTime = null;
    this.notify();
  }

  skip() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }

    if (this.mode === 'focus') {
      const nextMode = (this.cycleSession >= this.cycleLength) ? 'longBreak' : 'shortBreak';
      this.setMode(nextMode);
    } else {
      // Advance cycle session if coming off a break
      if (this.mode === 'longBreak') {
        this.cycleSession = 1;
      } else {
        this.cycleSession = Math.min(this.cycleLength, this.cycleSession + 1);
      }
      this.setMode('focus');
    }
  }

  setMode(mode, customSeconds = null) {
    if (customSeconds) {
      this.durations.custom = customSeconds;
      this.saveDurations({ custom: customSeconds });
    }
    this.mode = mode;
    this.reset();
  }

  syncWithTimestamp() {
    if (!this.endTime) return;
    const now = Date.now();
    this.remainingMs = Math.max(0, this.endTime - now);
    if (this.remainingMs <= 0) {
      this.handleComplete();
    } else {
      this.notify();
    }
  }

  loop() {
    if (this.state !== 'running') return;
    const now = Date.now();
    this.remainingMs = Math.max(0, this.endTime - now);

    if (this.remainingMs <= 0) {
      this.handleComplete();
      return;
    }

    this.notify();
    this.animFrame = requestAnimationFrame(() => this.loop());
  }

  handleComplete() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }

    this.state = 'completed';
    this.remainingMs = 0;

    if (this.mode === 'focus') {
      this.completedTotal++;
      this.completedToday++;
      setStorage(STORAGE_KEYS.SESSIONS, this.completedTotal.toString());
      setStorage(STORAGE_KEYS.TODAY, this.completedToday.toString());
    }

    if (this.soundEnabled) {
      playHarmonicChime();
    }

    if (this.notifsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      const title = this.mode === 'focus' ? 'ClockIt Focus Session Complete!' : 'Break Over — Ready to Focus?';
      const body = this.mode === 'focus' 
        ? 'Splendid work! Take a breath and enjoy your break.' 
        : 'Recharged and refreshed. Ready for your next sprint.';
      try {
        new Notification(title, { body, icon: '/favicon.svg' });
      } catch (e) {
        console.warn('[Pomodoro] Notification error', e);
      }
    }

    this.notify();
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    setStorage(STORAGE_KEYS.SOUND, this.soundEnabled ? 'true' : 'false');
    if (this.soundEnabled) {
      playHarmonicChime();
    }
    this.notify();
    return this.soundEnabled;
  }
}

// Global Singleton Engine
export const pomodoroEngine = new PomodoroEngine();
if (typeof window !== 'undefined') {
  window.pomodoroEngine = pomodoroEngine;
}

/**
 * Initializes DOM interactions, listeners, and views for the Pomodoro Timer
 */
export function initPomodoroTimer(showToastFn) {
  // DOM Elements - Full Timer View
  const timerView = document.getElementById('clockit-timer-view');
  const homeView = document.getElementById('clockit-home-view');
  const digitsEl = document.getElementById('pomodoro-digits');
  const ringFill = document.getElementById('pomodoro-ring-fill');
  const statusLabel = document.getElementById('pomodoro-status-label');
  const statusDot = document.getElementById('pomodoro-status-dot');
  const mottoEl = document.getElementById('pomodoro-motto');
  const playBtn = document.getElementById('pomodoro-play-btn');
  const resetBtn = document.getElementById('pomodoro-reset-btn');
  const skipBtn = document.getElementById('pomodoro-skip-btn');
  const modePills = document.querySelectorAll('.timer-mode-pill');
  const cycleText = document.getElementById('pomodoro-cycle-text');
  const totalCompleted = document.getElementById('pomodoro-total-completed');
  const sessionDots = document.querySelectorAll('#pomodoro-dots-row .session-dot');
  const soundToggleBtn = document.getElementById('timer-sound-toggle-btn');
  const settingsBtn = document.getElementById('timer-settings-btn');
  const zenBtn = document.getElementById('timer-zen-btn');
  const backToHomeBtn = document.getElementById('timer-back-to-home-btn');
  const arena = document.getElementById('pomodoro-circle-arena');
  const completionRipple = document.getElementById('pomodoro-completion-ripple');
  const completionBanner = document.getElementById('pomodoro-completion-banner');
  const completionTitle = document.getElementById('completion-banner-title');
  const completionSub = document.getElementById('completion-banner-sub');
  const completionNextBtn = document.getElementById('completion-next-action-btn');
  const completionDismissBtn = document.getElementById('completion-dismiss-btn');

  // DOM Elements - Settings Modal
  const settingsModal = document.getElementById('timer-settings-modal');
  const settingsCloseBtn = document.getElementById('timer-settings-close-btn');
  const settingsSaveBtn = document.getElementById('timer-settings-save-btn');
  const settingsResetDefaultsBtn = document.getElementById('timer-settings-reset-defaults');
  const inputFocus = document.getElementById('setting-focus-dur');
  const inputShort = document.getElementById('setting-short-dur');
  const inputLong = document.getElementById('setting-long-dur');
  const inputCustom = document.getElementById('setting-custom-dur');
  const inputSound = document.getElementById('setting-sound-enabled');
  const inputNotifs = document.getElementById('setting-notifs-enabled');

  // DOM Elements - Dashboard Summary Card (Sync Target)
  const cardDisplay = document.getElementById('clockit-timer-display');
  const cardBtn = document.getElementById('clockit-timer-btn');
  const cardSub = document.getElementById('clockit-timer-sub');
  const cardRingFill = document.getElementById('clockit-card-progress-fill');
  const cardModeBadge = document.getElementById('clockit-card-mode-badge');
  const cardExpandBtn = document.getElementById('clockit-timer-expand-btn');
  const dashboardCard = document.getElementById('clockit-dashboard-timer-card');

  // Nav pills in ClockIt header
  const navPills = document.querySelectorAll('.clockit-nav-links .clockit-nav-pill');
  const navTimerPill = document.getElementById('clockit-nav-timer');

  const MOTTO_MAP = {
    focus: 'Make today count. Stay in flow.',
    shortBreak: 'Rest your eyes, stretch, breathe deeply.',
    longBreak: 'Great sprint! Time for a restorative break.',
    custom: 'Custom focus session. Deep work in progress.'
  };

  const LABEL_MAP = {
    focus: 'Focus Session',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
    custom: 'Custom Session'
  };

  /**
   * View Switcher: switches between 'home' dashboard and 'timer' full view
   */
  function switchView(viewName) {
    if (typeof window.navigateToTrackerView === 'function') {
      window.navigateToTrackerView(viewName);
      return;
    }
    navPills.forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-view') === viewName);
    });

    if (viewName === 'timer') {
      if (homeView) homeView.style.display = 'none';
      if (timerView) {
        timerView.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      if (timerView) timerView.style.display = 'none';
      if (homeView) homeView.style.display = 'block';

      if (viewName === 'tasks') {
        const board = document.querySelector('.clockit-main-grid');
        if (board) board.scrollIntoView({ behavior: 'smooth' });
      } else if (viewName === 'notes') {
        const noteInput = document.getElementById('clockit-new-note-input');
        if (noteInput) {
          noteInput.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => noteInput.focus(), 300);
        }
      } else if (viewName === 'backlog') {
        const col = document.querySelector('.app-board-col[data-col="todo"]');
        if (col) col.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  // Hook nav pills
  navPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const targetView = pill.getAttribute('data-view') || 'home';
      switchView(targetView);
    });
  });

  // Back to home button
  if (backToHomeBtn) {
    backToHomeBtn.addEventListener('click', () => switchView('dashboard'));
  }

  // Expand button on dashboard card
  if (cardExpandBtn) {
    cardExpandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      switchView('timer');
    });
  }

  // Clicking anywhere on dashboard timer card (except play button) navigates to timer
  if (dashboardCard) {
    dashboardCard.style.cursor = 'pointer';
    dashboardCard.addEventListener('click', (e) => {
      if (e.target.closest('#clockit-timer-btn')) return;
      switchView('timer');
    });
  }

  /**
   * Update all UI elements based on engine snapshot
   */
  pomodoroEngine.addListener((snap) => {
    // 1. Update digits on full view and summary card
    if (digitsEl) digitsEl.textContent = snap.formattedTime;
    if (cardDisplay) cardDisplay.textContent = snap.formattedTime;

    // 2. Browser Tab Title sync
    if (snap.state === 'running') {
      document.title = `(${snap.rawTime}) ${snap.mode === 'focus' ? 'Focus' : 'Break'} • ClockIt`;
    } else if (snap.state === 'paused') {
      document.title = `[Paused] (${snap.rawTime}) • ClockIt`;
    } else if (snap.state === 'completed') {
      document.title = `✓ Complete! • ClockIt`;
    } else {
      document.title = 'ClockIt: Work Tracking and Sprint Velocity';
    }

    // 3. Circular Progress Ring (Full Timer View)
    if (ringFill) {
      // Dashoffset starts at 0 (full) or fills up as progress increases
      const offset = RING_CIRCUMFERENCE * (1 - snap.progress);
      ringFill.style.strokeDashoffset = offset.toFixed(2);

      // Shift ring gradient for break vs focus
      if (snap.mode === 'shortBreak' || snap.mode === 'longBreak') {
        ringFill.setAttribute('stroke', 'url(#pomoRingBreakGradient)');
      } else {
        ringFill.setAttribute('stroke', 'url(#pomoRingGradient)');
      }
    }

    // 4. Mini Ring on Dashboard Summary Card
    if (cardRingFill) {
      const miniOffset = MINI_RING_CIRCUMFERENCE * (1 - snap.progress);
      cardRingFill.style.strokeDashoffset = miniOffset.toFixed(2);
      if (snap.mode === 'shortBreak' || snap.mode === 'longBreak') {
        cardRingFill.setAttribute('stroke', '#3d8262');
      } else {
        cardRingFill.setAttribute('stroke', '#ba6542');
      }
    }

    // 5. Play / Pause button states
    const isRunning = snap.state === 'running';
    if (playBtn) {
      const playIcon = playBtn.querySelector('.pomo-play-icon');
      const pauseIcon = playBtn.querySelector('.pomo-pause-icon');
      if (playIcon) playIcon.style.display = isRunning ? 'none' : 'block';
      if (pauseIcon) pauseIcon.style.display = isRunning ? 'block' : 'none';
      playBtn.classList.toggle('is-running', isRunning);
      playBtn.setAttribute('title', isRunning ? 'Pause Timer (Space)' : 'Start Timer (Space)');
    }

    if (cardBtn) {
      const cardPlayIcon = cardBtn.querySelector('.timer-play-icon');
      const cardPauseIcon = cardBtn.querySelector('.timer-pause-icon');
      if (cardPlayIcon) cardPlayIcon.style.display = isRunning ? 'none' : 'block';
      if (cardPauseIcon) cardPauseIcon.style.display = isRunning ? 'block' : 'none';
    }

    // 6. Mode selector pill highlight & labels
    modePills.forEach(pill => {
      const m = pill.getAttribute('data-mode');
      const active = m === snap.mode;
      pill.classList.toggle('active', active);
      pill.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    // 7. Status Pill and Motto
    if (statusLabel) statusLabel.textContent = LABEL_MAP[snap.mode] || 'Focus Session';
    if (statusDot) {
      statusDot.classList.toggle('pulsing', isRunning);
      statusDot.style.background = (snap.mode.includes('Break')) ? '#3d8262' : '#ba6542';
    }

    if (mottoEl) {
      mottoEl.textContent = isRunning 
        ? MOTTO_MAP[snap.mode] 
        : (snap.state === 'paused' ? 'Timer paused. Ready when you are.' : MOTTO_MAP[snap.mode]);
    }

    // 8. Dashboard Card Meta
    if (cardModeBadge) {
      cardModeBadge.textContent = snap.mode === 'focus' ? 'Focus' : (snap.mode === 'custom' ? 'Custom' : 'Break');
    }
    if (cardSub) {
      if (snap.state === 'running') {
        cardSub.textContent = snap.mode === 'focus' ? 'Session in progress...' : 'Recharging...';
      } else if (snap.state === 'paused') {
        cardSub.textContent = 'Paused';
      } else {
        cardSub.textContent = 'Get things done.';
      }
    }

    // 9. Completed session dots & meta text
    sessionDots.forEach((dot, idx) => {
      dot.classList.remove('completed', 'current');
      if (idx < snap.cycleSession - 1) {
        dot.classList.add('completed');
      } else if (idx === snap.cycleSession - 1) {
        dot.classList.add('current');
      }
    });

    if (cycleText) {
      cycleText.textContent = `Session ${snap.cycleSession} of ${snap.cycleLength}`;
    }
    if (totalCompleted) {
      totalCompleted.textContent = `${snap.completedToday} completed today`;
    }

    // 10. Sound Toggle icon
    if (soundToggleBtn) {
      const soundOn = soundToggleBtn.querySelector('.sound-on-icon');
      const soundOff = soundToggleBtn.querySelector('.sound-off-icon');
      if (soundOn) soundOn.style.display = snap.soundEnabled ? 'block' : 'none';
      if (soundOff) soundOff.style.display = snap.soundEnabled ? 'none' : 'block';
      soundToggleBtn.setAttribute('title', snap.soundEnabled ? 'Sound: Chime enabled' : 'Sound: Muted');
    }

    // 11. Completion State Handling
    if (snap.state === 'completed') {
      showCompletionExperience(snap);
    }
  });

  /**
   * Tasteful Completion Animation & Feedback
   */
  function showCompletionExperience(snap) {
    if (completionRipple) {
      gsap.fromTo(completionRipple, 
        { opacity: 0.8, scale: 0.96 },
        { opacity: 0, scale: 1.25, duration: 1.8, ease: 'power2.out' }
      );
    }

    if (completionBanner) {
      completionBanner.hidden = false;
      if (completionTitle) {
        completionTitle.textContent = snap.mode === 'focus' 
          ? 'Focus Session Complete!' 
          : 'Break Finished!';
      }
      if (completionSub) {
        completionSub.textContent = snap.mode === 'focus' 
          ? `Outstanding work! You've logged ${snap.completedToday} session${snap.completedToday === 1 ? '' : 's'} today.`
          : 'Ready to dive back into your next high-velocity sprint?';
      }
      if (completionNextBtn) {
        if (snap.mode === 'focus') {
          const nextIsLong = (snap.cycleSession >= snap.cycleLength);
          completionNextBtn.textContent = nextIsLong 
            ? `Start Long Break (${Math.round(pomodoroEngine.durations.longBreak / 60)}m)` 
            : `Start Short Break (${Math.round(pomodoroEngine.durations.shortBreak / 60)}m)`;
        } else {
          completionNextBtn.textContent = `Start Focus Session (${Math.round(pomodoroEngine.durations.focus / 60)}m)`;
        }
      }

      gsap.fromTo('.completion-banner-card', 
        { scale: 0.9, opacity: 0, y: 16 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.4)' }
      );
    }

    if (typeof showToastFn === 'function') {
      showToastFn(snap.mode === 'focus' ? 'Session complete! Take a break.' : 'Break complete! Ready to focus.');
    }
  }

  // Completion banner actions
  if (completionNextBtn) {
    completionNextBtn.addEventListener('click', () => {
      if (completionBanner) completionBanner.hidden = true;
      pomodoroEngine.skip();
      pomodoroEngine.start();
    });
  }

  if (completionDismissBtn) {
    completionDismissBtn.addEventListener('click', () => {
      if (completionBanner) completionBanner.hidden = true;
      pomodoroEngine.reset();
    });
  }

  // Hook Controls
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      pomodoroEngine.toggle();
      // Spring click feedback
      gsap.fromTo(playBtn, { scale: 0.92 }, { scale: 1, duration: 0.25, ease: 'back.out(2)' });
    });
  }

  if (cardBtn) {
    cardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pomodoroEngine.toggle();
    });
  }

  const cardResetBtn = document.getElementById('clockit-timer-card-reset-btn');
  if (cardResetBtn) {
    cardResetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pomodoroEngine.reset();
      gsap.fromTo(cardResetBtn, { rotation: -180 }, { rotation: 0, duration: 0.35, ease: 'power2.out' });
      if (typeof showToastFn === 'function') showToastFn('Pomodoro timer reset');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      pomodoroEngine.reset();
      gsap.fromTo(resetBtn, { rotation: -180 }, { rotation: 0, duration: 0.35, ease: 'power2.out' });
      if (typeof showToastFn === 'function') showToastFn('Timer reset');
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      pomodoroEngine.skip();
      gsap.fromTo(skipBtn, { x: 5 }, { x: 0, duration: 0.25, ease: 'back.out(2)' });
      if (typeof showToastFn === 'function') showToastFn('Skipped to next session');
    });
  }

  // Mode pill buttons
  modePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const mode = pill.getAttribute('data-mode');
      if (mode && mode !== pomodoroEngine.mode) {
        // Transition gently between timer modes
        gsap.to(digitsEl, {
          opacity: 0.3,
          scale: 0.96,
          duration: 0.12,
          onComplete: () => {
            pomodoroEngine.setMode(mode);
            gsap.to(digitsEl, { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' });
          }
        });
      }
    });
  });

  // Sound toggle button
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      const isSound = pomodoroEngine.toggleSound();
      if (typeof showToastFn === 'function') {
        showToastFn(isSound ? 'Chime sound enabled' : 'Chime sound muted');
      }
    });
  }

  // Zen Mode toggle
  let isZenMode = false;
  if (zenBtn) {
    zenBtn.addEventListener('click', () => {
      isZenMode = !isZenMode;
      document.body.classList.toggle('pomodoro-zen-mode', isZenMode);
      zenBtn.classList.toggle('active', isZenMode);
      if (typeof showToastFn === 'function') {
        showToastFn(isZenMode ? 'Entered Zen focus mode (Press Esc to exit)' : 'Exited Zen mode');
      }
    });
  }

  // Settings Modal setup
  function openSettings() {
    if (!settingsModal) return;
    if (inputFocus) inputFocus.value = Math.round(pomodoroEngine.durations.focus / 60);
    if (inputShort) inputShort.value = Math.round(pomodoroEngine.durations.shortBreak / 60);
    if (inputLong) inputLong.value = Math.round(pomodoroEngine.durations.longBreak / 60);
    if (inputCustom) inputCustom.value = Math.round(pomodoroEngine.durations.custom / 60);
    if (inputSound) inputSound.checked = pomodoroEngine.soundEnabled;
    if (inputNotifs) inputNotifs.checked = pomodoroEngine.notifsEnabled;
    settingsModal.hidden = false;
  }

  function closeSettings() {
    if (settingsModal) settingsModal.hidden = true;
  }

  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  if (settingsCloseBtn) settingsCloseBtn.addEventListener('click', closeSettings);

  if (settingsResetDefaultsBtn) {
    settingsResetDefaultsBtn.addEventListener('click', () => {
      if (inputFocus) inputFocus.value = 25;
      if (inputShort) inputShort.value = 5;
      if (inputLong) inputLong.value = 15;
      if (inputCustom) inputCustom.value = 30;
      if (inputSound) inputSound.checked = true;
    });
  }

  if (settingsSaveBtn) {
    settingsSaveBtn.addEventListener('click', () => {
      const f = Math.max(1, parseInt(inputFocus.value, 10) || 25) * 60;
      const s = Math.max(1, parseInt(inputShort.value, 10) || 5) * 60;
      const l = Math.max(1, parseInt(inputLong.value, 10) || 15) * 60;
      const c = Math.max(1, parseInt(inputCustom.value, 10) || 30) * 60;

      pomodoroEngine.saveDurations({ focus: f, shortBreak: s, longBreak: l, custom: c });
      pomodoroEngine.soundEnabled = inputSound ? inputSound.checked : true;
      localStorage.setItem(STORAGE_KEYS.SOUND, pomodoroEngine.soundEnabled ? 'true' : 'false');

      // Request notification permission if checked
      if (inputNotifs && inputNotifs.checked) {
        if ('Notification' in window) {
          Notification.requestPermission().then(permission => {
            pomodoroEngine.notifsEnabled = (permission === 'granted');
            localStorage.setItem(STORAGE_KEYS.NOTIFS, pomodoroEngine.notifsEnabled ? 'true' : 'false');
          });
        }
      } else {
        pomodoroEngine.notifsEnabled = false;
        localStorage.setItem(STORAGE_KEYS.NOTIFS, 'false');
      }

      // Update pills time labels
      const pFocus = document.getElementById('mode-pill-time-focus');
      const pShort = document.getElementById('mode-pill-time-short');
      const pLong = document.getElementById('mode-pill-time-long');
      const pCustom = document.getElementById('mode-pill-time-custom');
      if (pFocus) pFocus.textContent = `${Math.round(f / 60)}m`;
      if (pShort) pShort.textContent = `${Math.round(s / 60)}m`;
      if (pLong) pLong.textContent = `${Math.round(l / 60)}m`;
      if (pCustom) pCustom.textContent = `${Math.round(c / 60)}m`;

      closeSettings();
      if (typeof showToastFn === 'function') showToastFn('Timer durations saved');
    });
  }

  // Parallax on Mountain Landscape Behind Timer
  if (arena) {
    arena.addEventListener('mousemove', (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = arena.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      gsap.to('#pomo-parallax-sun', { x: nx * 14, y: ny * 10, duration: 0.5, ease: 'power1.out' });
      gsap.to('#pomo-parallax-birds', { x: nx * 18, y: ny * 12, duration: 0.4, ease: 'power1.out' });
      gsap.to('#pomo-parallax-mtn-back', { x: nx * 8, y: ny * 5, duration: 0.6, ease: 'power1.out' });
      gsap.to('#pomo-parallax-mtn-mid', { x: nx * 5, y: ny * 3, duration: 0.7, ease: 'power1.out' });
      gsap.to('#pomo-parallax-mtn-front', { x: nx * 2.5, y: ny * 1.5, duration: 0.8, ease: 'power1.out' });
      gsap.to('#pomo-parallax-trees', { x: nx * 2.5, y: ny * 1.5, duration: 0.8, ease: 'power1.out' });
    });

    arena.addEventListener('mouseleave', () => {
      gsap.to([
        '#pomo-parallax-sun',
        '#pomo-parallax-birds',
        '#pomo-parallax-mtn-back',
        '#pomo-parallax-mtn-mid',
        '#pomo-parallax-mtn-front',
        '#pomo-parallax-trees'
      ], {
        x: 0,
        y: 0,
        duration: 0.9,
        ease: 'power2.out'
      });
    });
  }

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Ignore if typing in input/textarea/select
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      pomodoroEngine.toggle();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      pomodoroEngine.reset();
    } else if (e.code === 'KeyS') {
      e.preventDefault();
      pomodoroEngine.skip();
    } else if (e.code === 'Escape') {
      if (settingsModal && !settingsModal.hidden) {
        closeSettings();
      } else if (isZenMode) {
        isZenMode = false;
        document.body.classList.remove('pomodoro-zen-mode');
        if (zenBtn) zenBtn.classList.remove('active');
      }
    }
  });

  // URL hash check on initial load: `#timer` or `#clockit`
  if (window.location.hash.toLowerCase().includes('timer')) {
    switchView('timer');
  }

  // Expose switchView to global for external triggers (e.g. hero card click)
  window.switchClockitView = switchView;
}
