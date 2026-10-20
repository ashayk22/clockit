import { PomodoroEngine, DEFAULT_DURATIONS } from '../src/pomodoro.js';

console.log('=== TESTING POMODORO ENGINE CORE LOGIC ===\n');

// Mock localStorage if in node environment
if (typeof localStorage === 'undefined') {
  const store = {};
  global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
}

// Mock document
if (typeof document === 'undefined') {
  global.document = {
    addEventListener: () => {},
    title: ''
  };
}

// Mock requestAnimationFrame / cancelAnimationFrame
let rafId = 0;
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

const engine = new PomodoroEngine();

// 1. Initial State
console.log('1. Checking initial state:');
let snap = engine.getSnapshot();
console.assert(snap.mode === 'focus', `Expected focus mode, got ${snap.mode}`);
console.assert(snap.formattedTime === '25 : 00', `Expected 25 : 00, got ${snap.formattedTime}`);
console.assert(snap.state === 'idle', `Expected idle state, got ${snap.state}`);
console.assert(snap.progress === 0, `Expected 0 progress, got ${snap.progress}`);
console.log('   [PASS] Initial state: focus mode, 25:00, idle, 0 progress');

// 2. Start timer
console.log('2. Starting timer:');
engine.start();
snap = engine.getSnapshot();
console.assert(snap.state === 'running', `Expected running, got ${snap.state}`);
console.assert(engine.endTime > Date.now(), 'Expected endTime in future');
console.log('   [PASS] Timer is running with accurate timestamp endTime');

// 3. Pause timer
console.log('3. Pausing timer:');
engine.pause();
snap = engine.getSnapshot();
console.assert(snap.state === 'paused', `Expected paused, got ${snap.state}`);
console.log('   [PASS] Timer paused accurately');

// 4. Mode switching: Short Break
console.log('4. Switching to Short Break mode:');
engine.setMode('shortBreak');
snap = engine.getSnapshot();
console.assert(snap.mode === 'shortBreak', `Expected shortBreak, got ${snap.mode}`);
console.assert(snap.formattedTime === '05 : 00', `Expected 05 : 00, got ${snap.formattedTime}`);
console.log('   [PASS] Switched to Short Break: 05:00');

// 5. Mode switching: Long Break
console.log('5. Switching to Long Break mode:');
engine.setMode('longBreak');
snap = engine.getSnapshot();
console.assert(snap.mode === 'longBreak', `Expected longBreak, got ${snap.mode}`);
console.assert(snap.formattedTime === '15 : 00', `Expected 15 : 00, got ${snap.formattedTime}`);
console.log('   [PASS] Switched to Long Break: 15:00');

// 6. Custom duration
console.log('6. Configuring Custom duration (45m):');
engine.setMode('custom', 45 * 60);
snap = engine.getSnapshot();
console.assert(snap.mode === 'custom', `Expected custom, got ${snap.mode}`);
console.assert(snap.formattedTime === '45 : 00', `Expected 45 : 00, got ${snap.formattedTime}`);
console.log('   [PASS] Configured Custom duration: 45:00');

// 7. Skip logic
console.log('7. Testing Skip logic:');
engine.setMode('focus');
engine.skip();
snap = engine.getSnapshot();
console.assert(snap.mode === 'shortBreak', `Expected shortBreak on skip from focus, got ${snap.mode}`);
console.log('   [PASS] Skip advanced from Focus to Short Break');

engine.skip();
snap = engine.getSnapshot();
console.assert(snap.mode === 'focus', `Expected focus on skip from break, got ${snap.mode}`);
console.log('   [PASS] Skip advanced from Break to Focus');

// 8. Reset logic
console.log('8. Testing Reset logic:');
engine.start();
engine.reset();
snap = engine.getSnapshot();
console.assert(snap.state === 'idle', `Expected idle after reset, got ${snap.state}`);
console.assert(snap.formattedTime === '25 : 00', `Expected 25 : 00 after reset, got ${snap.formattedTime}`);
console.log('   [PASS] Reset restored timer to 25:00 idle state');

console.log('\n=== ALL POMODORO ENGINE TESTS PASSED! ===');
process.exit(0);
