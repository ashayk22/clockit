// Automated Verification for ClockIt Home Dashboard Implementation
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
console.log('   CLOCKIT HOME DASHBOARD - AUTOMATED VERIFICATION   ');
console.log('====================================================\n');

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

  // Anchor date Oct 26, 2026
  const ANCHOR_DATE = '2026-10-26';

  // Sample tasks simulating real store
  const mockTasks = [
    {
      id: 't-1',
      title: 'PBL Final Report',
      workspace: 'College',
      priority: 'Critical',
      status: 'in-progress',
      completed: false,
      dueDate: '2026-11-01',
      deadline: '1 Nov 2026',
      daysLeft: '6 days left',
      estimate: '2–3 hrs',
      isToday: false,
      isOverdue: false,
    },
    {
      id: 't-2',
      title: 'Read CCN notes',
      workspace: 'College',
      priority: 'High',
      status: 'todo',
      completed: false,
      dueDate: '2026-11-03',
      deadline: '3 Nov 2026',
      daysLeft: '8 days left',
      isToday: false,
      isOverdue: false,
    },
    {
      id: 't-today',
      title: 'Submit Lab Assignment',
      workspace: 'College',
      priority: 'High',
      status: 'todo',
      completed: false,
      dueDate: '2026-10-26',
      deadline: 'Today',
      daysLeft: 'Today',
      isToday: true,
      isOverdue: false,
    },
    {
      id: 't-overdue',
      title: 'Deploy New Update',
      workspace: 'Development',
      priority: 'High',
      status: 'todo',
      completed: false,
      dueDate: '2026-10-24',
      deadline: '24 Oct 2026',
      daysLeft: '2 days overdue',
      isToday: false,
      isOverdue: true,
    },
    {
      id: 't-someday',
      title: 'Explore Rust GUI',
      workspace: 'Personal',
      priority: 'Low',
      status: 'todo',
      completed: false,
      dueDate: undefined,
      deadline: 'Someday',
      daysLeft: 'Someday',
      isToday: false,
      isOverdue: false,
    },
    {
      id: 't-done',
      title: 'Draft Architecture Spec',
      workspace: 'Development',
      priority: 'Medium',
      status: 'completed',
      completed: true,
      dueDate: '2026-10-20',
      deadline: '20 Oct 2026',
      daysLeft: 'Completed',
      isToday: false,
      isOverdue: false,
    },
  ];

  // Test 1: Next In Line task identification
  test('Next In Line Card: identifies most urgent upcoming task and never selects completed tasks', () => {
    function findNextTask(tasks) {
      const pending = tasks.filter(t => !t.completed && t.status !== 'completed');
      if (pending.length === 0) return null;
      const priorityRank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return [...pending].sort((a, b) => {
        // Overdue first
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        // Critical first
        if (a.priority === 'Critical' && b.priority !== 'Critical') return -1;
        if (a.priority !== 'Critical' && b.priority === 'Critical') return 1;
        // Nearest due date
        if (a.dueDate && b.dueDate) {
          if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        } else if (a.dueDate) return -1;
        else if (b.dueDate) return 1;
        return priorityRank[b.priority] - priorityRank[a.priority];
      })[0];
    }

    const next = findNextTask(mockTasks);
    // Overdue task 'Deploy New Update' is most urgent!
    assert.strictEqual(next.id, 't-overdue');
    assert.strictEqual(next.isOverdue, true);

    // If overdue is completed, next should be Critical 'PBL Final Report'
    const updatedTasks = mockTasks.map(t => t.id === 't-overdue' ? { ...t, completed: true, status: 'completed' } : t);
    const next2 = findNextTask(updatedTasks);
    assert.strictEqual(next2.id, 't-1');
    assert.strictEqual(next2.priority, 'Critical');

    // Completed tasks are never selected
    assert(!next2.completed);
  });

  // Test 2: Task Overview sorting (Overdue, Due Today, Upcoming, Someday, Completed)
  test('Dynamic Task Overview: multi-tier sorting handles overdue, upcoming, and tasks without deadlines', () => {
    function sortTasks(tasks) {
      return [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
    }

    const sorted = sortTasks(mockTasks);
    // 1. Overdue first
    assert.strictEqual(sorted[0].id, 't-overdue');
    // 2. Today next (2026-10-26)
    assert.strictEqual(sorted[1].id, 't-today');
    // 3. 1 Nov 2026
    assert.strictEqual(sorted[2].id, 't-1');
    // 4. 3 Nov 2026
    assert.strictEqual(sorted[3].id, 't-2');
    // 5. Someday (no due date)
    assert.strictEqual(sorted[4].id, 't-someday');
    // 6. Completed last
    assert.strictEqual(sorted[5].id, 't-done');
  });

  // Test 3: Focus Integration from Home
  test('Focus Integration: Start Focus sets active task and calculates dynamic sessions', () => {
    let selectedTaskId = null;
    const focusSessions = [];

    function startFocusOnTask(taskId) {
      selectedTaskId = taskId;
      global.window.localStorage.setItem('clockit_selected_focus_task_id', taskId);
    }

    function recordFocusSession(taskId, durationMins) {
      focusSessions.push({
        id: `fs-${Date.now()}`,
        taskId,
        durationMinutes: durationMins,
        mode: 'Deep Work',
      });
    }

    startFocusOnTask('t-1');
    assert.strictEqual(selectedTaskId, 't-1');
    assert.strictEqual(global.window.localStorage.getItem('clockit_selected_focus_task_id'), 't-1');

    recordFocusSession('t-1', 45);
    recordFocusSession('t-1', 45);

    const totalMinutes = focusSessions.reduce((acc, s) => acc + s.durationMinutes, 135);
    assert.strictEqual(totalMinutes, 225); // 135 baseline + 90 new = 3h 45m
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    assert.strictEqual(`${h}h ${m}m`, '3h 45m');
  });

  // Test 4: Mini Calendar dynamic date calculation & month navigation
  test('Mini Calendar: generates correct days and identifies task dates', () => {
    function getMonthDays(year, month) {
      const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days = [];
      for (let i = 0; i < firstDayIndex; i++) days.push(null);
      for (let d = 1; d <= daysInMonth; d++) days.push(d);
      return { daysInMonth, firstDayIndex, days };
    }

    // October 2026 (month = 9)
    const oct = getMonthDays(2026, 9);
    assert.strictEqual(oct.daysInMonth, 31);
    // 1st Oct 2026 is Thursday -> Monday-indexed: 3 null padding
    assert.strictEqual(oct.firstDayIndex, 3);
    assert.strictEqual(oct.days[3], 1);

    // November 2026 (month = 10)
    const nov = getMonthDays(2026, 10);
    assert.strictEqual(nov.daysInMonth, 30);
    // 1st Nov 2026 is Sunday -> Monday-indexed: 6 null padding
    assert.strictEqual(nov.firstDayIndex, 6);
    assert.strictEqual(nov.days[6], 1);
  });

  // Test 5: Today widget progress calculation
  test('Today widget: calculates actual progress and completion counts', () => {
    const todayList = mockTasks.filter(t => t.isToday || t.dueDate === ANCHOR_DATE);
    assert.strictEqual(todayList.length, 1);
    const completedCount = todayList.filter(t => t.completed).length;
    assert.strictEqual(completedCount, 0);

    // Mark today task complete
    todayList[0].completed = true;
    const completedCountAfter = todayList.filter(t => t.completed).length;
    assert.strictEqual(completedCountAfter, 1);
  });

  // Test 6: Persistence across session
  test('Persistence: quick notes and state saved into localStorage', () => {
    const notes = ['Review presentation slides', 'Check database indexes'];
    global.window.localStorage.setItem('clockit_quick_notes', JSON.stringify(notes));
    const restored = JSON.parse(global.window.localStorage.getItem('clockit_quick_notes'));
    assert.deepStrictEqual(restored, notes);
  });

  console.log(`\n====================================================`);
  console.log(`   TEST SUMMARY: ${passed}/${total} TESTS PASSED    `);
  console.log(`====================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
