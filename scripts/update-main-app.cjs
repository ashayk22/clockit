const fs = require('fs');

let mainJs = fs.readFileSync('src/main.js', 'utf8');

const appDashboardCode = `
// ============================================================================
// ACTUAL APP: INTERACTIVE SPRINT 34 DASHBOARD
// ============================================================================

const INITIAL_SPRINT_TASKS = [
  { id: 'ST-101', title: 'Distributed Redis lease coordinator with heartbeat', squad: 'Platform', pts: 5, status: 'inprogress', assignee: 'AC' },
  { id: 'ST-104', title: 'WebSocket sync stream for active sprint standup', squad: 'Platform', pts: 8, status: 'todo', assignee: 'JB' },
  { id: 'ST-112', title: 'Optimistic UI rollback and conflict resolution modal', squad: 'Frontend', pts: 3, status: 'review', assignee: 'SL' },
  { id: 'ST-115', title: 'Automated SOC 2 token revocation middleware', squad: 'Security', pts: 5, status: 'done', assignee: 'MV' },
  { id: 'ST-118', title: 'Multi-cloud Terraform VPC peering configuration', squad: 'DevOps', pts: 5, status: 'review', assignee: 'ER' },
  { id: 'ST-120', title: 'Cluster autoscaling threshold alert channels', squad: 'DevOps', pts: 3, status: 'todo', assignee: 'JB' },
  { id: 'ST-122', title: 'Interactive soundstage lo-fi audio deck', squad: 'Frontend', pts: 5, status: 'done', assignee: 'AC' },
  { id: 'ST-125', title: 'Zero-downtime database schema migration runner', squad: 'Platform', pts: 8, status: 'inprogress', assignee: 'AC' },
];

let appSprintTasks = [...INITIAL_SPRINT_TASKS];
let activeSquadFilter = 'all';
let activeSearchQuery = '';

function saveAppTasks() {
  try {
    localStorage.setItem('tracker_app_tasks', JSON.stringify(appSprintTasks));
  } catch (e) {}
}

function loadAppTasks() {
  try {
    const stored = localStorage.getItem('tracker_app_tasks');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        appSprintTasks = parsed;
        return;
      }
    }
  } catch (e) {}
  appSprintTasks = [...INITIAL_SPRINT_TASKS];
}

function updateAppMetrics() {
  let totalPts = 0;
  let donePts = 0;
  let todoCount = 0;
  let inprogCount = 0;
  let reviewCount = 0;
  let doneCount = 0;

  appSprintTasks.forEach(t => {
    totalPts += t.pts;
    if (t.status === 'done') donePts += t.pts;
    if (t.status === 'todo') todoCount++;
    if (t.status === 'inprogress') inprogCount++;
    if (t.status === 'review') reviewCount++;
    if (t.status === 'done') doneCount++;
  });

  const velEl = document.getElementById('app-stat-velocity');
  const progBar = document.getElementById('app-stat-progress-bar');
  const badgeEl = document.getElementById('app-velocity-badge');
  const captionEl = document.getElementById('app-stat-caption');

  const pct = totalPts > 0 ? Math.round((donePts / totalPts) * 100) : 0;
  if (velEl) velEl.innerHTML = \`\${donePts} / \${totalPts} <span class="stat-unit">pts</span>\`;
  if (progBar) progBar.style.width = \`\${pct}%\`;
  if (badgeEl) badgeEl.textContent = \`\${pct}% Target\`;
  if (captionEl) captionEl.textContent = \`\${totalPts - donePts} pts remaining to sprint completion\`;

  // Update counts
  const cTodo = document.getElementById('app-count-todo');
  const cInprog = document.getElementById('app-count-inprogress');
  const cRev = document.getElementById('app-count-review');
  const cDone = document.getElementById('app-count-done');
  const navBadge = document.getElementById('app-badge-active');
  const chipAll = document.getElementById('chip-count-all');

  if (cTodo) cTodo.textContent = todoCount;
  if (cInprog) cInprog.textContent = inprogCount;
  if (cRev) cRev.textContent = reviewCount;
  if (cDone) cDone.textContent = doneCount;
  if (navBadge) navBadge.textContent = appSprintTasks.length;
  if (chipAll) chipAll.textContent = appSprintTasks.length;
}

function renderAppDashboard() {
  const colTodo = document.getElementById('app-cards-todo');
  const colInprog = document.getElementById('app-cards-inprogress');
  const colReview = document.getElementById('app-cards-review');
  const colDone = document.getElementById('app-cards-done');
  const tableBody = document.getElementById('app-issues-table-body');

  if (!colTodo || !colInprog || !colReview || !colDone) return;

  colTodo.innerHTML = '';
  colInprog.innerHTML = '';
  colReview.innerHTML = '';
  colDone.innerHTML = '';
  if (tableBody) tableBody.innerHTML = '';

  const q = activeSearchQuery.toLowerCase().trim();
  const filtered = appSprintTasks.filter(t => {
    const matchSquad = activeSquadFilter === 'all' || t.squad.toLowerCase() === activeSquadFilter.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.squad.toLowerCase().includes(q);
    return matchSquad && matchSearch;
  });

  filtered.forEach(task => {
    // Kanban Card
    const card = document.createElement('div');
    card.className = 'app-task-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', task.id);
    card.setAttribute('tabindex', '0');

    card.innerHTML = \`
      <div class="app-card-top">
        <span class="app-card-id">\${task.id}</span>
        <span class="app-card-pts">\${task.pts} pts</span>
      </div>
      <div class="app-card-title">\${task.title}</div>
      <div class="app-card-bottom">
        <span class="app-squad-tag \${task.squad}">\${task.squad}</span>
        <div class="app-card-right-meta">
          <div class="app-card-actions">
            <button class="app-card-action-btn advance" title="Advance status" type="button">&rarr;</button>
            <button class="app-card-action-btn delete" title="Delete task" type="button">&times;</button>
          </div>
          <div class="app-assignee-avatar" title="Assignee: \${task.assignee}">\${task.assignee}</div>
        </div>
      </div>
    \`;

    // Click to advance or button
    card.querySelector('.advance').addEventListener('click', (e) => {
      e.stopPropagation();
      advanceAppTask(task.id);
    });

    card.querySelector('.delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteAppTask(task.id);
    });

    card.addEventListener('click', () => {
      advanceAppTask(task.id);
    });

    // Drag-and-drop
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', task.id);
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    if (task.status === 'todo') colTodo.appendChild(card);
    else if (task.status === 'inprogress') colInprog.appendChild(card);
    else if (task.status === 'review') colReview.appendChild(card);
    else if (task.status === 'done') colDone.appendChild(card);

    // List View Table Row
    if (tableBody) {
      const tr = document.createElement('tr');
      tr.innerHTML = \`
        <td style="font-weight: 600; color: var(--color-slate-gray, #777b86);">\${task.id}</td>
        <td style="font-weight: 500;">\${task.title}</td>
        <td><span class="app-squad-tag \${task.squad}">\${task.squad}</span></td>
        <td><span class="status-badge \${task.status}">\${task.status}</span></td>
        <td><strong>\${task.pts} pts</strong></td>
        <td><div class="app-assignee-avatar" style="display:inline-flex;">\${task.assignee}</div></td>
        <td style="text-align: right;">
          <button class="pill-btn-ghost-sm" style="height:26px; font-size:11px; padding:0 8px;" type="button">Next &rarr;</button>
        </td>
      \`;
      tr.querySelector('button').addEventListener('click', () => advanceAppTask(task.id));
      tableBody.appendChild(tr);
    }
  });

  updateAppMetrics();
}

function advanceAppTask(taskId) {
  const task = appSprintTasks.find(t => t.id === taskId);
  if (!task) return;

  const flow = {
    'todo': 'inprogress',
    'inprogress': 'review',
    'review': 'done',
    'done': 'todo'
  };

  task.status = flow[task.status] || 'todo';
  saveAppTasks();
  renderAppDashboard();

  if (task.status === 'done') {
    showToast(\`\${task.id} completed & merged into main! (+\${task.pts} pts)\`);
  } else if (task.status === 'todo') {
    showToast(\`\${task.id} returned to Backlog\`);
  } else {
    showToast(\`\${task.id} moved to \${task.status.toUpperCase()}\`);
  }
}

function deleteAppTask(taskId) {
  const idx = appSprintTasks.findIndex(t => t.id === taskId);
  if (idx === -1) return;
  const removed = appSprintTasks.splice(idx, 1)[0];
  saveAppTasks();
  renderAppDashboard();
  showToast(\`Removed \${removed.id}: \${removed.title}\`);
}

function initAppDragAndDrop() {
  const cols = document.querySelectorAll('.app-board-col');
  cols.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.style.background = 'rgba(245, 155, 107, 0.08)';
    });

    col.addEventListener('dragleave', () => {
      col.style.background = '';
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.style.background = '';
      const taskId = e.dataTransfer.getData('text/plain');
      const targetStatus = col.getAttribute('data-col');
      const task = appSprintTasks.find(t => t.id === taskId);
      if (task && targetStatus && task.status !== targetStatus) {
        task.status = targetStatus;
        saveAppTasks();
        renderAppDashboard();
        showToast(\`\${task.id} moved to \${targetStatus.toUpperCase()}\`);
      }
    });
  });
}

function initAppDashboard() {
  loadAppTasks();
  renderAppDashboard();
  initAppDragAndDrop();

  // Search input with real-time filtering
  const searchInput = document.getElementById('app-task-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeSearchQuery = e.target.value;
      renderAppDashboard();
    });

    // Keyboard shortcut /
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput && !document.activeElement.matches('input, textarea')) {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  // Squad chips filter (Board toolbar)
  const squadChips = document.querySelectorAll('.squad-chip');
  squadChips.forEach(chip => {
    chip.addEventListener('click', () => {
      squadChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeSquadFilter = chip.getAttribute('data-filter') || 'all';

      // Sync sidebar squad filter
      document.querySelectorAll('.app-squad-filter').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-squad') === activeSquadFilter);
      });

      renderAppDashboard();
    });
  });

  // Sidebar squad filter
  const sidebarSquadBtns = document.querySelectorAll('.app-squad-filter');
  sidebarSquadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sidebarSquadBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSquadFilter = btn.getAttribute('data-squad') || 'all';

      // Sync board toolbar chips
      document.querySelectorAll('.squad-chip').forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-filter') === activeSquadFilter);
      });

      renderAppDashboard();
    });
  });

  // Tab views (Board vs List vs Analytics)
  const appTabLinks = document.querySelectorAll('.app-nav-link');
  const panelBoard = document.getElementById('app-panel-board');
  const panelList = document.getElementById('app-panel-list');
  const panelAnalytics = document.getElementById('app-panel-analytics');

  appTabLinks.forEach(link => {
    link.addEventListener('click', () => {
      appTabLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const tab = link.getAttribute('data-app-tab');

      if (panelBoard) panelBoard.hidden = tab !== 'board';
      if (panelList) panelList.hidden = tab !== 'list';
      if (panelAnalytics) panelAnalytics.hidden = tab !== 'analytics';
    });
  });

  // Reset Board Button
  const resetBtn = document.getElementById('app-reset-board-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      appSprintTasks = [...INITIAL_SPRINT_TASKS];
      activeSquadFilter = 'all';
      activeSearchQuery = '';
      if (searchInput) searchInput.value = '';
      document.querySelectorAll('.squad-chip').forEach(c => c.classList.toggle('active', c.getAttribute('data-filter') === 'all'));
      document.querySelectorAll('.app-squad-filter').forEach(b => b.classList.toggle('active', b.getAttribute('data-squad') === 'all'));
      saveAppTasks();
      renderAppDashboard();
      showToast('Sprint 34 board reset to baseline');
    });
  }

  // Create Issue Form & Modal
  const openNewTaskBtn = document.getElementById('app-new-task-btn');
  const createTaskModal = document.getElementById('app-create-task-modal');
  const createTaskForm = document.getElementById('app-create-task-form');

  if (openNewTaskBtn) {
    openNewTaskBtn.addEventListener('click', () => {
      openModal('app-create-task-modal');
      const titleInput = document.getElementById('new-task-title');
      if (titleInput) setTimeout(() => titleInput.focus(), 100);
    });
  }

  if (createTaskForm) {
    createTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleEl = document.getElementById('new-task-title');
      const squadEl = document.getElementById('new-task-squad');
      const ptsEl = document.getElementById('new-task-points');

      const title = titleEl ? titleEl.value.trim() : '';
      const squad = squadEl ? squadEl.value : 'Platform';
      const pts = ptsEl ? parseInt(ptsEl.value, 10) || 3 : 3;

      if (!title) return;

      const nextNum = 126 + appSprintTasks.length;
      const newTask = {
        id: \`ST-\${nextNum}\`,
        title,
        squad,
        pts,
        status: 'todo',
        assignee: 'AC'
      };

      appSprintTasks.unshift(newTask);
      saveAppTasks();
      renderAppDashboard();
      closeModal('app-create-task-modal');
      if (titleEl) titleEl.value = '';
      showToast(\`Created task \${newTask.id}: \${title}\`);
    });
  }

  // App Theme Toggle button (syncs with global theme)
  const appThemeBtn = document.getElementById('app-theme-toggle-btn');
  if (appThemeBtn) {
    appThemeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('tracker-theme', isDark ? 'dark' : 'light');
      showToast(isDark ? 'Switched to Dark mode' : 'Switched to Light mode', 2000);
    });
  }
}

// ============================================================================
// DUMMY AUTH SYSTEM & VIEW NAVIGATION
// ============================================================================

function initAuthSystem() {
  const navDemoBtn = document.getElementById('nav-demo-signin-btn');
  const modalDemoBtn = document.getElementById('modal-demo-signin-btn');
  const navUserPill = document.getElementById('nav-user-pill');
  const openAuthBtn = document.getElementById('open-auth-btn');
  const navCtaBtn = document.getElementById('nav-cta-btn');
  const navOpenAppBtn = document.getElementById('nav-open-app-btn');
  const navSignoutBtn = document.getElementById('nav-signout-btn');
  const appExitBtn = document.getElementById('app-exit-view-btn');
  const appSignoutBtn = document.getElementById('app-signout-action-btn');
  const actualAppView = document.getElementById('actual-app-view');

  function updateAuthUI(isLoggedIn) {
    if (navUserPill) navUserPill.hidden = !isLoggedIn;
    if (openAuthBtn) openAuthBtn.hidden = isLoggedIn;
    if (navDemoBtn) navDemoBtn.hidden = isLoggedIn;
    if (navCtaBtn) navCtaBtn.hidden = isLoggedIn;
  }

  function enterAppDashboard() {
    document.body.classList.add('in-app-mode');
    if (actualAppView) actualAppView.hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderAppDashboard();
  }

  function exitAppDashboard() {
    document.body.classList.remove('in-app-mode');
    if (actualAppView) actualAppView.hidden = true;
    ScrollTrigger.refresh();
  }

  function signInAsDemo(suppressToast = false) {
    localStorage.setItem('tracker-demo-auth', 'true');
    updateAuthUI(true);
    closeModal('auth-modal');
    enterAppDashboard();
    if (!suppressToast) {
      showToast('Signed in as Alex Chen (Staff Engineer) • Sprint 34 Active', 3500);
    }
  }

  function signOut() {
    localStorage.removeItem('tracker-demo-auth');
    updateAuthUI(false);
    exitAppDashboard();
    showToast('Signed out of Acme Engineering workspace');
  }

  // Restore existing session if signed in
  const isAuth = localStorage.getItem('tracker-demo-auth') === 'true';
  updateAuthUI(isAuth);

  // Nav Demo Sign In Button
  if (navDemoBtn) {
    navDemoBtn.addEventListener('click', () => signInAsDemo());
  }

  // Modal Demo Sign In Button
  if (modalDemoBtn) {
    modalDemoBtn.addEventListener('click', () => signInAsDemo());
  }

  // Open App Button when signed in
  if (navOpenAppBtn) {
    navOpenAppBtn.addEventListener('click', enterAppDashboard);
  }

  // Sign out buttons
  if (navSignoutBtn) navSignoutBtn.addEventListener('click', signOut);
  if (appSignoutBtn) appSignoutBtn.addEventListener('click', signOut);

  // Back to website
  if (appExitBtn) {
    appExitBtn.addEventListener('click', () => {
      exitAppDashboard();
      showToast('Returned to Tracker marketing overview');
    });
  }
}
`;

// Replace DOMContentLoaded block
const oldBoot = `window.addEventListener('DOMContentLoaded', () => {
  initSteepHeroAnimation();
  initInteractiveKanbanBoard();
  initFaqAccordion();
  initModals();
  initScrollIsland();
  initAuthDrawer();
  initThemeToggle();
  initMusicWidget();
});`;

const newBoot = `${appDashboardCode}

window.addEventListener('DOMContentLoaded', () => {
  initSteepHeroAnimation();
  initInteractiveKanbanBoard();
  initFaqAccordion();
  initModals();
  initScrollIsland();
  initAuthDrawer();
  initThemeToggle();
  initMusicWidget();
  initAuthSystem();
  initAppDashboard();
});`;

if (mainJs.includes(oldBoot)) {
  mainJs = mainJs.replace(oldBoot, newBoot);
  fs.writeFileSync('src/main.js', mainJs, 'utf8');
  console.log('Successfully updated src/main.js with App Dashboard & Auth System!');
} else {
  console.error('Could not find old boot block in src/main.js');
}
