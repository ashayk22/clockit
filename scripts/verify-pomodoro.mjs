import { readFileSync } from 'fs';

console.log('=== VERIFYING CLOCKIT POMODORO TIMER IMPLEMENTATION ===\n');

// 1. Verify index.html structure
const html = readFileSync('index.html', 'utf8');

const requiredElements = [
  'id="clockit-timer-view"',
  'id="clockit-home-view"',
  'id="clockit-nav-timer"',
  'id="pomodoro-digits"',
  'id="pomodoro-ring-fill"',
  'id="pomodoro-play-btn"',
  'id="pomodoro-reset-btn"',
  'id="pomodoro-skip-btn"',
  'id="pomodoro-status-pill"',
  'id="pomodoro-motto"',
  'id="pomodoro-dots-row"',
  'id="pomodoro-cycle-text"',
  'id="pomodoro-total-completed"',
  'id="timer-settings-modal"',
  'id="timer-sound-toggle-btn"',
  'id="timer-zen-btn"',
  'id="pomodoro-completion-banner"',
  'id="pomodoro-svg-stage"',
  'id="pomodoroCircleClip"',
  'id="pomoSunGlow"',
  'id="pomoMtnBack"',
  'id="pomoMtnMid"',
  'id="pomoMtnFront"',
  'id="pomo-parallax-sun"',
  'id="pomo-parallax-mtn-back"',
  'id="pomo-parallax-mtn-mid"',
  'id="pomo-parallax-mtn-front"',
  'id="pomo-parallax-trees"',
  'id="clockit-dashboard-timer-card"',
  'id="clockit-card-progress-fill"',
  'id="clockit-timer-expand-btn"'
];

let allElementsPresent = true;
requiredElements.forEach(selector => {
  if (html.includes(selector)) {
    console.log(`[PASS] Found in index.html: ${selector}`);
  } else {
    console.error(`[FAIL] Missing in index.html: ${selector}`);
    allElementsPresent = false;
  }
});

// 2. Verify CSS styles in src/style.css
const css = readFileSync('src/style.css', 'utf8');
const requiredStyles = [
  '.clockit-timer-view',
  '.pomodoro-stage-card',
  '.timer-mode-selector',
  '.timer-mode-pill',
  '.pomodoro-circle-arena',
  '.pomodoro-digits',
  '.pomodoro-ring-fill',
  '.timer-control-btn.play-btn',
  '.session-dot',
  '.timer-settings-modal',
  '.pomodoro-completion-banner',
  'body.pomodoro-zen-mode',
  '@media (prefers-reduced-motion: reduce)'
];

let allStylesPresent = true;
requiredStyles.forEach(style => {
  if (css.includes(style)) {
    console.log(`[PASS] Found in src/style.css: ${style}`);
  } else {
    console.error(`[FAIL] Missing in src/style.css: ${style}`);
    allStylesPresent = false;
  }
});

// 3. Verify JavaScript engine in src/pomodoro.js
const pomodoroCode = readFileSync('src/pomodoro.js', 'utf8');
const requiredJsFeatures = [
  'class PomodoroEngine',
  'Date.now()',
  'syncWithTimestamp()',
  'document.addEventListener(\'visibilitychange\'',
  'playHarmonicChime()',
  'initPomodoroTimer',
  'switchClockitView',
  'saveDurations',
  'shortBreak',
  'longBreak',
  'custom'
];

let allJsPresent = true;
requiredJsFeatures.forEach(feat => {
  if (pomodoroCode.includes(feat)) {
    console.log(`[PASS] Found in src/pomodoro.js: ${feat}`);
  } else {
    console.error(`[FAIL] Missing in src/pomodoro.js: ${feat}`);
    allJsPresent = false;
  }
});

if (allElementsPresent && allStylesPresent && allJsPresent) {
  console.log('\n=== ALL CLOCKIT POMODORO VERIFICATIONS PASSED SUCCESSFULLY! ===');
} else {
  console.error('\n=== SOME VERIFICATIONS FAILED ===');
  process.exit(1);
}
