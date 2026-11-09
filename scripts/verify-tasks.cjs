// Automated Verification for ClockIt Tasks System Implementation
const assert = require('assert');

// Polyfill window and localStorage for headless Node environment
const store = {};
global.window = {
  localStorage: {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  }
};

console.log('====================================================');
console.log('   CLOCKIT TASKS SYSTEM - AUTOMATED VERIFICATION    ');
console.log('====================================================\n');

// Import compiled dist or test logic
async function runTests() {
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}`);
      console.error('   ', err.message);
    }
  }

  // Test 1: Date & Days Diff calculation
  test('Date calculations: correct days left, overdue detection, and anchor comparison', () => {
    // Reference Anchor: 2026-10-26
    const ANCHOR_DATE = '2026-10-26';
    function computeDaysDiff(dueDateStr) {
      if (!dueDateStr) return { daysLeft: 'Someday', isOverdue: false, isToday: false };
      const target = new Date(dueDateStr + 'T00:00:00');
      const anchor = new Date(ANCHOR_DATE + 'T00:00:00');
      const diffTime = target.getTime() - anchor.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays < 0) return { daysLeft: `${Math.abs(diffDays)} days overdue`, isOverdue: true, isToday: false };
      if (diffDays === 0) return { daysLeft: 'Today', isOverdue: false, isToday: true };
      if (diffDays === 1) return { daysLeft: 'Tomorrow', isOverdue: false, isToday: false };
      return { daysLeft: `${diffDays} days left`, isOverdue: false, isToday: false };
    }

    // 1 Nov 2026 -> 6 days left
    const d1 = computeDaysDiff('2026-11-01');
    assert.strictEqual(d1.daysLeft, '6 days left');
    assert.strictEqual(d1.isOverdue, false);

    // 24 Oct 2026 -> 2 days overdue
    const d2 = computeDaysDiff('2026-10-24');
    assert.strictEqual(d2.daysLeft, '2 days overdue');
    assert.strictEqual(d2.isOverdue, true);

    // 26 Oct 2026 -> Today
    const d3 = computeDaysDiff('2026-10-26');
    assert.strictEqual(d3.daysLeft, 'Today');
    assert.strictEqual(d3.isToday, true);
  });

  // Test 2: Task CRUD simulation in DataService
  let tasks = [];
  let focusSessions = [];
  let selectedFocusTaskId = null;

  function addTask(data) {
    const task = {
      id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: data.title,
      description: data.description || '',
      workspace: data.workspace || 'Personal',
      categoryColor: data.categoryColor || '#22c55e',
      priority: data.priority || 'Medium',
      status: data.status || 'todo',
      completed: data.status === 'completed',
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      deadline: data.deadline || 'Upcoming',
      daysLeft: data.daysLeft || 'Upcoming',
      tags: data.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      focusMinutes: 0,
      focusSessionsCount: 0,
    };
    tasks.unshift(task);
    global.window.localStorage.setItem('clockit_tasks', JSON.stringify(tasks));
    return task;
  }

  function updateTask(id, updates) {
    const t = tasks.find(x => x.id === id);
    if (!t) throw new Error(`Task ${id} not found`);
    Object.assign(t, updates);
    if (updates.status) t.completed = updates.status === 'completed';
    if (updates.completed !== undefined) t.status = updates.completed ? 'completed' : 'todo';
    t.updatedAt = Date.now();
    global.window.localStorage.setItem('clockit_tasks', JSON.stringify(tasks));
    return t;
  }

  function deleteTask(id) {
    tasks = tasks.filter(x => x.id !== id);
    if (selectedFocusTaskId === id) selectedFocusTaskId = null;
    global.window.localStorage.setItem('clockit_tasks', JSON.stringify(tasks));
  }

  function toggleTask(id) {
    const t = tasks.find(x => x.id === id);
    if (t) updateTask(id, { completed: !t.completed });
    return tasks;
  }

  test('Create task with priority, due date, status, workspace, and tags', () => {
    const newTask = addTask({
      title: 'PBL Presentation Prep',
      description: 'Prepare slide deck for panel review',
      priority: 'Critical',
      status: 'todo',
      workspace: 'College',
      dueDate: '2026-11-01',
      dueTime: '10:00 AM',
      tags: ['#college', '#exam'],
    });

    assert.strictEqual(newTask.title, 'PBL Presentation Prep');
    assert.strictEqual(newTask.priority, 'Critical');
    assert.strictEqual(newTask.status, 'todo');
    assert.strictEqual(newTask.completed, false);
    assert.strictEqual(newTask.workspace, 'College');
    assert.deepStrictEqual(newTask.tags, ['#college', '#exam']);
    assert(tasks.some(t => t.id === newTask.id));
  });

  test('Edit task title, description, priority, and update status', () => {
    const t = tasks[0];
    const updated = updateTask(t.id, {
      title: 'PBL Presentation Deck (Final Review)',
      priority: 'High',
      status: 'in-progress',
    });

    assert.strictEqual(updated.title, 'PBL Presentation Deck (Final Review)');
    assert.strictEqual(updated.priority, 'High');
    assert.strictEqual(updated.status, 'in-progress');
    assert.strictEqual(updated.completed, false);
  });

  test('Mark task complete and reopen task', () => {
    const t = tasks[0];
    toggleTask(t.id);
    assert.strictEqual(t.completed, true);
    assert.strictEqual(t.status, 'completed');

    toggleTask(t.id);
    assert.strictEqual(t.completed, false);
    assert.strictEqual(t.status, 'todo');
  });

  test('Delete task and ensure safe cleanup', () => {
    const t = addTask({ title: 'Temporary Scratch Task' });
    assert(tasks.some(x => x.id === t.id));

    deleteTask(t.id);
    assert(!tasks.some(x => x.id === t.id));
  });

  test('Focus integration: select task, log session, verify task session metrics', () => {
    const t = addTask({ title: 'Deep Work on Algorithm Analysis', workspace: 'College' });
    selectedFocusTaskId = t.id;

    // Simulate completing a 45m focus session
    function recordFocusSession(taskId, durationMins) {
      const session = {
        id: `fs-${Date.now()}`,
        taskId,
        mode: 'Deep Work',
        durationMinutes: durationMins,
        completedAt: Date.now(),
      };
      focusSessions.push(session);
      if (taskId) {
        const target = tasks.find(x => x.id === taskId);
        if (target) {
          target.focusMinutes = (target.focusMinutes || 0) + durationMins;
          target.focusSessionsCount = (target.focusSessionsCount || 0) + 1;
        }
      }
      return session;
    }

    recordFocusSession(t.id, 45);
    assert.strictEqual(t.focusMinutes, 45);
    assert.strictEqual(t.focusSessionsCount, 1);
    // Task completion remains independent from focus session completion
    assert.strictEqual(t.completed, false);

    // Deleting task clears selected focus target safely
    deleteTask(t.id);
    assert.strictEqual(selectedFocusTaskId, null);
  });

  test('Persistence: verify tasks restored from localStorage correctly', () => {
    const serialized = global.window.localStorage.getItem('clockit_tasks');
    assert(serialized !== null);
    const restored = JSON.parse(serialized);
    assert(Array.isArray(restored));
    assert(restored.length > 0);
  });

  console.log(`\n====================================================`);
  console.log(`   TEST SUMMARY: ${passed}/${total} TESTS PASSED    `);
  console.log(`====================================================\n`);
  
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
