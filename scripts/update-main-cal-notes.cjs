const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
let content = fs.readFileSync(mainPath, 'utf8');

// 1. Locate start of CALENDAR VIEW in main.js
const calStartMarker = '// CALENDAR VIEW (Weekly view displaying tasks & deadlines)';
const notesGraphStartMarker = '// ============================================================================\n// MASTER VIEW NAVIGATION';

const calStartIdx = content.indexOf(calStartMarker);
const notesGraphStartIdx = content.indexOf(notesGraphStartMarker);

if (calStartIdx === -1 || notesGraphStartIdx === -1) {
  console.error('Could not find markers in src/main.js');
  process.exit(1);
}

// Extract the Obsidian Knowledge Graph helper functions from existing code so they remain intact
// Find renderKnowledgeGraph
const renderGraphIdx = content.indexOf('function renderKnowledgeGraph()', calStartIdx);
let graphCode = '';
if (renderGraphIdx !== -1 && renderGraphIdx < notesGraphStartIdx) {
  graphCode = content.substring(renderGraphIdx, notesGraphStartIdx);
}

const newCalendarAndJournalCode = `// ============================================================================
// SUBSCRIPTION & SPRINT CALENDAR (watermelon.sh Specification)
// Features: Month navigation, Day grid with activeGlow, Overlays (Add, Search, Summary)
// ============================================================================

let subCalCurrentMonth = 'October';
let subCalCurrentYear = 2026;
let subCalCurrentMonthIndex = 9; // 0-indexed (9 = Oct)
let subCalSelectedId = 'day-28';
let subCalSelectedDayNum = 28;
let subCalDownloading = false;

// Initial subscription items & deadlines
let subCalItems = [
  { id: 'sub-1', name: 'Netflix 4K', amount: 15.99, date: 3, logo: '🎬', type: 'monthly', isNew: false, squad: 'Personal' },
  { id: 'sub-2', name: 'Figma Enterprise', amount: 15.00, date: 6, logo: '🎨', type: 'monthly', isNew: false, squad: 'UI/UX' },
  { id: 'sub-3', name: 'Spotify Duo', amount: 9.99, date: 10, logo: '🎵', type: 'monthly', isNew: false, squad: 'Personal' },
  { id: 'sub-4', name: 'GitHub Copilot', amount: 10.00, date: 14, logo: '🐙', type: 'monthly', isNew: false, squad: 'Frontend' },
  { id: 'sub-5', name: 'Jira Cloud', amount: 7.50, date: 15, logo: '📊', type: 'monthly', isNew: false, squad: 'Product' },
  { id: 'sub-6', name: 'AWS Cloud Hosting', amount: 45.00, date: 18, logo: '☁️', type: 'monthly', isNew: false, squad: 'DevOps' },
  { id: 'sub-7', name: 'Vercel Pro', amount: 20.00, date: 21, logo: '▲', type: 'monthly', isNew: true, squad: 'Frontend' },
  { id: 'sub-8', name: 'Slack Business', amount: 8.75, date: 24, logo: '💬', type: 'monthly', isNew: false, squad: 'Team' },
  { id: 'sub-9', name: 'Supabase Pro Cloud', amount: 25.00, date: 28, logo: '⚡', type: 'monthly', isNew: true, squad: 'Backend' },
  { id: 'sub-10', name: 'Domain Renewal', amount: 12.00, date: 30, logo: '🌐', type: 'yearly', isNew: true, squad: 'DevOps' }
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year, monthIdx) {
  return new Date(year, monthIdx + 1, 0).getDate();
}

function getFirstDayOfWeek(year, monthIdx) {
  // Return 0 for Mon, 1 for Tue, ... 6 for Sun
  const jsDay = new Date(year, monthIdx, 1).getDay();
  return (jsDay + 6) % 7;
}

function renderSubscriptionCalendar() {
  const heading = document.getElementById('sub-cal-month-year');
  if (heading) heading.textContent = \`\${subCalCurrentMonth}, \${subCalCurrentYear}\`;

  const matrix = document.getElementById('sub-cal-days-matrix');
  if (!matrix) return;
  matrix.innerHTML = '';

  const totalDays = getDaysInMonth(subCalCurrentYear, subCalCurrentMonthIndex);
  const startDayOffset = getFirstDayOfWeek(subCalCurrentYear, subCalCurrentMonthIndex);

  // Prev month padding days
  const prevMonthDays = getDaysInMonth(subCalCurrentYear, (subCalCurrentMonthIndex - 1 + 12) % 12);
  for (let i = startDayOffset - 1; i >= 0; i--) {
    const padDate = prevMonthDays - i;
    const padCell = document.createElement('div');
    padCell.className = 'sub-cal-day-cell is-muted';
    padCell.innerHTML = \`<span class="sub-cal-day-num">\${padDate}</span>\`;
    matrix.appendChild(padCell);
  }

  // Active month days (1 to totalDays)
  for (let d = 1; d <= totalDays; d++) {
    const dayCell = document.createElement('button');
    dayCell.type = 'button';
    const dayId = \`day-\${d}\`;
    const isSelected = subCalSelectedId === dayId;
    dayCell.className = \`sub-cal-day-cell \${isSelected ? 'is-active-glow' : ''}\`;
    dayCell.setAttribute('data-day', d);

    // Find subscriptions or tasks for this day
    const matchingSubs = subCalItems.filter(s => s.date === d);
    const dayTasks = appSprintTasks.filter(t => {
      // Map day abbreviations or dates
      const taskDayNum = t.dayNum || (d === 21 && t.day === 'Wed' ? 21 : (d === 19 && t.day === 'Mon' ? 19 : 0));
      return taskDayNum === d;
    });

    let logoMarkup = '';
    if (matchingSubs.length > 0) {
      logoMarkup = \`<span class="sub-cell-logo">\${matchingSubs[0].logo}</span>\`;
    }

    let indicatorsMarkup = '';
    if (matchingSubs.length > 0 || dayTasks.length > 0) {
      const isYearly = matchingSubs.some(s => s.type === 'yearly');
      const dotClass = isYearly ? 'dot-yellow' : 'dot-purple';
      indicatorsMarkup = \`<span class="sub-cell-indicator-dot \${dotClass}"></span>\`;
    }

    dayCell.innerHTML = \`
      <div class="sub-cell-content">
        <span class="sub-cal-day-num">\${d}</span>
        \${logoMarkup}
      </div>
      \${indicatorsMarkup ? \`<div class="sub-cell-dots-wrap">\${indicatorsMarkup}</div>\` : ''}
    \`;

    dayCell.addEventListener('click', () => {
      subCalSelectedId = dayId;
      subCalSelectedDayNum = d;
      renderSubscriptionCalendar();
      renderSelectedDayDetails(d);
    });

    matrix.appendChild(dayCell);
  }

  // Next month padding days to complete 35 or 42 grid slots
  const filledSlots = startDayOffset + totalDays;
  const targetSlots = filledSlots > 35 ? 42 : 35;
  for (let p = 1; p <= (targetSlots - filledSlots); p++) {
    const nextPadCell = document.createElement('div');
    nextPadCell.className = 'sub-cal-day-cell is-muted';
    nextPadCell.innerHTML = \`<span class="sub-cal-day-num">\${p}</span>\`;
    matrix.appendChild(nextPadCell);
  }

  // Update summary counts and figures
  updateSubscriptionMetrics();
  renderSelectedDayDetails(subCalSelectedDayNum);
}

function updateSubscriptionMetrics() {
  const totalSpend = subCalItems.reduce((acc, item) => acc + (item.amount || 0), 0);
  const activeCount = subCalItems.length;
  const newCount = subCalItems.filter(s => s.isNew).length;

  const totalEl = document.getElementById('sub-cal-total-display');
  if (totalEl) totalEl.textContent = \`$\${totalSpend.toFixed(2)}\`;

  const countsLabel = document.getElementById('sub-cal-counts-label');
  if (countsLabel) countsLabel.textContent = \`\${activeCount} SUBS / \${newCount} NEW\`;

  const summaryActive = document.getElementById('summary-active-count');
  if (summaryActive) summaryActive.textContent = activeCount;

  const summaryNew = document.getElementById('summary-new-count');
  if (summaryNew) summaryNew.textContent = newCount;

  const summarySpend = document.getElementById('summary-total-spend');
  if (summarySpend) summarySpend.textContent = \`$\${totalSpend.toFixed(2)}\`;
}

function renderSelectedDayDetails(dayNum) {
  const dateTitle = document.getElementById('sub-selected-date-title');
  if (dateTitle) {
    dateTitle.textContent = \`\${subCalCurrentMonth} \${dayNum}, \${subCalCurrentYear}\`;
  }

  const badge = document.getElementById('sub-selected-status-badge');
  if (badge) {
    badge.textContent = dayNum === 21 ? 'Today' : 'Scheduled';
    badge.classList.toggle('badge-today', dayNum === 21);
  }

  const feed = document.getElementById('sub-selected-items-feed');
  if (!feed) return;
  feed.innerHTML = '';

  const daySubs = subCalItems.filter(s => s.date === dayNum);
  const dayTasks = appSprintTasks.filter(t => (t.dayNum === dayNum) || (dayNum === 21 && t.day === 'Wed'));

  if (daySubs.length === 0 && dayTasks.length === 0) {
    feed.innerHTML = \`
      <div class="detail-empty-state">
        <span class="detail-empty-icon">☕</span>
        <p class="detail-empty-text">No recurring payments or deadlines scheduled for this day.</p>
      </div>
    \`;
    return;
  }

  // Render Subscriptions for this day
  daySubs.forEach(s => {
    const row = document.createElement('div');
    row.className = 'detail-event-row is-subscription';
    row.innerHTML = \`
      <div class="event-row-left">
        <span class="event-row-logo">\${s.logo || '💳'}</span>
        <div class="event-row-info">
          <span class="event-row-name">\${escapeHtml(s.name)}</span>
          <span class="event-row-tag tag-sub">\${s.type.toUpperCase()}</span>
        </div>
      </div>
      <div class="event-row-right">
        <span class="event-row-cost font-serif">$\${s.amount.toFixed(2)}</span>
      </div>
    \`;
    feed.appendChild(row);
  });

  // Render Sprint Tasks for this day
  dayTasks.forEach(t => {
    const isDone = t.status === 'done';
    const row = document.createElement('div');
    row.className = \`detail-event-row is-task \${isDone ? 'is-completed' : ''}\`;
    row.innerHTML = \`
      <div class="event-row-left">
        <input type="checkbox" class="detail-task-check" \${isDone ? 'checked' : ''}>
        <div class="event-row-info">
          <span class="event-row-name">\${escapeHtml(t.title)}</span>
          <div class="event-row-meta">
            <span class="event-task-id">\${t.id}</span>
            <span class="app-squad-tag squad-\${(t.squad||'').toLowerCase()}">\${t.squad}</span>
          </div>
        </div>
      </div>
      <div class="event-row-right">
        <span class="event-task-pts">\${t.pts}p</span>
      </div>
    \`;

    row.querySelector('.detail-task-check').addEventListener('click', (e) => {
      e.stopPropagation();
      t.status = e.target.checked ? 'done' : 'todo';
      saveAppTasks();
      renderAppDashboard();
      renderSelectedDayDetails(dayNum);
      showToast(e.target.checked ? \`\${t.id} marked as Done!\` : \`\${t.id} returned to active\`);
    });

    feed.appendChild(row);
  });
}

function initSubscriptionCalendar() {
  renderSubscriptionCalendar();

  // Navigation Arrows
  const prevBtn = document.getElementById('sub-cal-prev-month');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      subCalCurrentMonthIndex = (subCalCurrentMonthIndex - 1 + 12) % 12;
      if (subCalCurrentMonthIndex === 11) subCalCurrentYear--;
      subCalCurrentMonth = MONTH_NAMES[subCalCurrentMonthIndex];
      renderSubscriptionCalendar();
    });
  }

  const nextBtn = document.getElementById('sub-cal-next-month');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      subCalCurrentMonthIndex = (subCalCurrentMonthIndex + 1) % 12;
      if (subCalCurrentMonthIndex === 0) subCalCurrentYear++;
      subCalCurrentMonth = MONTH_NAMES[subCalCurrentMonthIndex];
      renderSubscriptionCalendar();
    });
  }

  // Today button
  const todayBtn = document.getElementById('sub-cal-today-btn');
  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      subCalCurrentMonthIndex = 9; // October
      subCalCurrentYear = 2026;
      subCalCurrentMonth = 'October';
      subCalSelectedId = 'day-21';
      subCalSelectedDayNum = 21;
      renderSubscriptionCalendar();
      showToast('Jumped to Today: 21 October 2026');
    });
  }

  // Quick Add Modal Trigger & Close
  const quickAddBtn = document.getElementById('sub-cal-quick-add-btn');
  const addModal = document.getElementById('sub-cal-add-modal');
  const addClose = document.getElementById('sub-cal-add-close');
  const addSubmit = document.getElementById('sub-add-submit-btn');

  if (quickAddBtn && addModal) {
    quickAddBtn.addEventListener('click', () => {
      addModal.hidden = false;
      const nameInput = document.getElementById('sub-add-name');
      if (nameInput) setTimeout(() => nameInput.focus(), 80);
    });
  }
  if (addClose && addModal) {
    addClose.addEventListener('click', () => { addModal.hidden = true; });
  }

  if (addSubmit) {
    addSubmit.addEventListener('click', () => {
      const nameInput = document.getElementById('sub-add-name');
      const amountInput = document.getElementById('sub-add-amount');
      const dateInput = document.getElementById('sub-add-date');
      const name = nameInput ? nameInput.value.trim() : '';
      const amountStr = amountInput ? amountInput.value.replace(/[^0-9.]/g, '') : '10.00';
      const dayVal = dateInput ? parseInt(dateInput.value, 10) : subCalSelectedDayNum;

      if (!name) {
        showToast('Please enter a service name');
        return;
      }

      const amount = parseFloat(amountStr) || 12.00;
      const day = (dayVal >= 1 && dayVal <= 31) ? dayVal : subCalSelectedDayNum;

      subCalItems.push({
        id: \`sub-\${Date.now()}\`,
        name,
        amount,
        date: day,
        logo: '💳',
        type: 'monthly',
        isNew: true,
        squad: 'Frontend'
      });

      if (addModal) addModal.hidden = true;
      if (nameInput) nameInput.value = '';
      if (amountInput) amountInput.value = '';

      subCalSelectedId = \`day-\${day}\`;
      subCalSelectedDayNum = day;
      renderSubscriptionCalendar();
      showToast(\`Added subscription: \${name} ($\${amount.toFixed(2)})\`);
    });
  }

  // Search Modal Trigger & Search Logic
  const searchTrigger = document.getElementById('sub-tool-search-trigger');
  const searchModal = document.getElementById('sub-cal-search-modal');
  const searchClose = document.getElementById('sub-cal-search-close');
  const searchInput = document.getElementById('sub-cal-search-input');
  const searchResults = document.getElementById('sub-cal-search-results');

  if (searchTrigger && searchModal) {
    searchTrigger.addEventListener('click', () => {
      searchModal.hidden = false;
      if (searchInput) setTimeout(() => searchInput.focus(), 80);
    });
  }
  if (searchClose && searchModal) {
    searchClose.addEventListener('click', () => { searchModal.hidden = true; });
  }

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        searchResults.innerHTML = '<p class="sub-cal-empty-hint">Start typing to see results</p>';
        return;
      }

      const matches = subCalItems.filter(s => s.name.toLowerCase().includes(q));
      if (matches.length === 0) {
        searchResults.innerHTML = \`<p class="sub-cal-empty-hint">No subscriptions found for "\${escapeHtml(q)}"</p>\`;
        return;
      }

      searchResults.innerHTML = matches.map(m => \`
        <div class="search-result-row" data-day="\${m.date}">
          <span class="search-result-name">\${escapeHtml(m.name)}</span>
          <span class="search-result-badge">Day \${m.date} &bull; $\${m.amount.toFixed(2)}</span>
        </div>
      \`).join('');

      searchResults.querySelectorAll('.search-result-row').forEach(row => {
        row.addEventListener('click', () => {
          const d = parseInt(row.getAttribute('data-day'), 10);
          subCalSelectedId = \`day-\${d}\`;
          subCalSelectedDayNum = d;
          if (searchModal) searchModal.hidden = true;
          renderSubscriptionCalendar();
        });
      });
    });
  }

  // Monthly Summary Cube Trigger
  const cubeTrigger = document.getElementById('sub-tool-cube-trigger');
  const summaryModal = document.getElementById('sub-cal-summary-modal');
  const summaryClose = document.getElementById('sub-cal-summary-close');

  if (cubeTrigger && summaryModal) {
    cubeTrigger.addEventListener('click', () => {
      updateSubscriptionMetrics();
      summaryModal.hidden = false;
    });
  }
  if (summaryClose && summaryModal) {
    summaryClose.addEventListener('click', () => { summaryModal.hidden = true; });
  }

  // Download export with simulated 1.8s spinner
  const downloadBtn = document.getElementById('sub-tool-download-btn');
  const spinner = document.getElementById('sub-download-spinner');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (subCalDownloading) return;
      subCalDownloading = true;
      downloadBtn.classList.add('is-loading');
      if (spinner) spinner.hidden = false;

      setTimeout(() => {
        subCalDownloading = false;
        downloadBtn.classList.remove('is-loading');
        if (spinner) spinner.hidden = true;
        showToast('Exported October 2026 Subscription Schedule (.csv)');
      }, 1600);
    });
  }

  // Add event for this day button in right panel
  const detailAddBtn = document.getElementById('sub-detail-add-event-btn');
  if (detailAddBtn) {
    detailAddBtn.addEventListener('click', () => {
      if (addModal) {
        addModal.hidden = false;
        const dateInput = document.getElementById('sub-add-date');
        if (dateInput) dateInput.value = subCalSelectedDayNum;
        const nameInput = document.getElementById('sub-add-name');
        if (nameInput) setTimeout(() => nameInput.focus(), 80);
      }
    });
  }
}

// Alias for view router
const renderCalendarView = renderSubscriptionCalendar;
const initCalendarView = initSubscriptionCalendar;

// ============================================================================
// DATED SHORT NOTES (JournalNavigation - watermelon.sh Specification)
// Vertical draggable/clickable date reel, month transition, and daily log entries
// ============================================================================

const JOURNAL_ENTRIES = [
  {
    id: 'entry-14',
    day: 14,
    month: 'OCTOBER',
    year: 2026,
    title: 'Sprint 12 Kickoff & Scope Allocation',
    paragraphs: [
      'Sprint 12 officially commenced with cross-functional team alignment.',
      'Target velocity set to 54 story points across Frontend, Backend, and DevOps squads.'
    ],
    checklist: [
      { text: 'Finalize API contract with backend team', done: true },
      { text: 'Set up staging environment pipelines', done: true },
      { text: 'Publish Sprint 12 backlog items to Kanban board', done: true }
    ],
    table: [
      { squad: 'Frontend', pts: '23p', lead: 'Alex Chen' },
      { squad: 'Backend', pts: '19p', lead: 'R. Kumar' },
      { squad: 'DevOps', pts: '12p', lead: 'J. Doe' }
    ]
  },
  {
    id: 'entry-15',
    day: 15,
    month: 'OCTOBER',
    year: 2026,
    title: 'API Authentication & Real-Time Sync',
    paragraphs: [
      'Implemented token refresh middleware for high-concurrency requests.',
      'Configured WebSocket heartbeat lease with Redis coordinator for instant task status updates.'
    ],
    checklist: [
      { text: 'Configure JWT validation pipeline', done: true },
      { text: 'Run load simulation on auth proxy', done: true },
      { text: 'Link [[API Authentication]] with user dashboard', done: false }
    ],
    table: [
      { service: 'Auth Proxy', latency: '4.2ms', status: 'Healthy' },
      { service: 'Redis Sync', latency: '1.8ms', status: 'Healthy' }
    ]
  },
  {
    id: 'entry-16',
    day: 16,
    month: 'OCTOBER',
    year: 2026,
    title: 'Visual Design Tokens & Typography Hierarchy',
    paragraphs: [
      'Integrated warm cream background (#faf8f5) with peach accents (#fa6a2e) for high editorial polish.',
      'Configured Instrument Serif for headings and Inter for high-density UI elements.'
    ],
    checklist: [
      { text: 'Publish color tokens to CSS variables', done: true },
      { text: 'Tune dark mode contrast ratios for WCAG AAA compliance', done: true },
      { text: 'Verify typography rendering across Safari and Chromium', done: true }
    ]
  },
  {
    id: 'entry-17',
    day: 17,
    month: 'OCTOBER',
    year: 2026,
    title: 'Interactive Kanban Drag-and-Drop',
    paragraphs: [
      'Created 4-column agile board: Backlog, In Progress, In Review, and Done & Merged.',
      'Implemented live point tallying and optimistic UI updates for real-time responsiveness.'
    ],
    checklist: [
      { text: 'Implement HTML5 drag events with dropzone glow', done: true },
      { text: 'Add keyboard navigation shortcuts for task cards', done: true },
      { text: 'Persist column state changes to local storage', done: true }
    ]
  },
  {
    id: 'entry-18',
    day: 18,
    month: 'OCTOBER',
    year: 2026,
    title: 'Pomodoro Focus Timer & Parallax Landscape',
    paragraphs: [
      'Built fully functional Pomodoro engine with 25:00 work interval and 5:00 rest intervals.',
      'Wired SVG circular progress ring and audio chime notifications upon interval completion.'
    ],
    checklist: [
      { text: 'Expose window.pomodoroEngine for external controls', done: true },
      { text: 'Sync dashboard mini-timer card with full mountain focus view', done: true },
      { text: 'Add interval reset and sound mute toggles', done: true }
    ]
  },
  {
    id: 'entry-21',
    day: 21,
    month: 'OCTOBER',
    year: 2026,
    title: 'Subscription Calendar & Daily Journal (Today)',
    paragraphs: [
      'Integrated watermelon.sh Subscription Calendar with active glow highlights and quick search.',
      'Built vertical date scroller JournalNavigation with staggered text animation for daily sprint logs.'
    ],
    checklist: [
      { text: 'Mount 35-day subscription matrix with recurring spend metrics', done: true },
      { text: 'Wire vertical reel navigation for 31 days with smooth drag/click', done: true },
      { text: 'Link daily entries to Obsidian Knowledge Graph with straight line geometry', done: true }
    ],
    table: [
      { module: 'Calendar', status: 'Active', latency: '1.2ms' },
      { module: 'Journal Nav', status: 'Active', latency: '0.9ms' }
    ]
  },
  {
    id: 'entry-24',
    day: 24,
    month: 'OCTOBER',
    year: 2026,
    title: 'Performance Profiling & Bundle Optimization',
    paragraphs: [
      'Conducted bundle tree-shaking pass. Vite production build compiles in under 300ms.',
      'Ensured zero extraneous npm packages and verified Lighthouse CWV performance score at 98.'
    ],
    checklist: [
      { text: 'Profile Largest Contentful Paint (LCP < 1.1s)', done: true },
      { text: 'Audit Interaction to Next Paint (INP < 50ms)', done: true },
      { text: 'Confirm zero console warnings across all 6 views', done: true }
    ]
  },
  {
    id: 'entry-28',
    day: 28,
    month: 'OCTOBER',
    year: 2026,
    title: 'Sprint 12 Release & Retrospective',
    paragraphs: [
      'Final milestone audit: all 12 sprint issues verified against acceptance criteria.',
      'Total sprint delivery reached 54/54 points with 100% test pass rate.'
    ],
    checklist: [
      { text: 'Generate release changelog for v1.2.0', done: true },
      { text: 'Tag git release commit and archive sprint analytics', done: true },
      { text: 'Celebrate team velocity win over team lunch!', done: false }
    ]
  }
];

let journalCurrentIndex = 5; // Default to Oct 21 (Today)
let journalDirection = 0;
const ITEM_HEIGHT = 44;

function renderJournalNavigation() {
  const currentEntry = JOURNAL_ENTRIES[journalCurrentIndex] || JOURNAL_ENTRIES[0];

  // Month & Day Labels
  const monthEl = document.getElementById('journal-entry-month-label');
  const dayEl = document.getElementById('journal-entry-day-label');
  const yearEl = document.getElementById('journal-entry-year-label');

  if (monthEl) monthEl.textContent = currentEntry.month;
  if (dayEl) dayEl.textContent = String(currentEntry.day).padStart(2, '0');
  if (yearEl) yearEl.textContent = currentEntry.year || 2026;

  // Render vertical tape track (days 01 to 31)
  const track = document.getElementById('journal-tape-track');
  if (track) {
    track.innerHTML = '';
    const allDays = Array.from({ length: 31 }, (_, i) => i + 1);

    allDays.forEach(d => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const hasEntryIndex = JOURNAL_ENTRIES.findIndex(e => e.day === d);
      const isSelected = currentEntry.day === d;

      btn.className = \`journal-tape-btn \${isSelected ? 'is-active-tape-day' : ''} \${hasEntryIndex !== -1 ? 'has-entry' : ''}\`;
      btn.textContent = String(d).padStart(2, '0');

      btn.addEventListener('click', () => {
        if (hasEntryIndex !== -1) {
          journalDirection = hasEntryIndex > journalCurrentIndex ? 1 : -1;
          journalCurrentIndex = hasEntryIndex;
        } else {
          // Create blank template entry for this day
          JOURNAL_ENTRIES.push({
            id: \`entry-\${d}\`,
            day: d,
            month: 'OCTOBER',
            year: 2026,
            title: \`Daily Log for October \${d}\`,
            paragraphs: [\`Daily log entry for October \${d}, 2026.\`],
            checklist: [{ text: 'Log sprint progress', done: false }]
          });
          JOURNAL_ENTRIES.sort((a, b) => a.day - b.day);
          journalCurrentIndex = JOURNAL_ENTRIES.findIndex(e => e.day === d);
        }
        renderJournalNavigation();
      });

      track.appendChild(btn);
    });

    // Animate vertical scroll position to center selected day
    const dayBtnIndex = currentEntry.day - 1;
    const targetY = -(dayBtnIndex * ITEM_HEIGHT) + (2 * ITEM_HEIGHT);
    gsap.to(track, {
      y: targetY,
      duration: 0.35,
      ease: 'power2.out'
    });
  }

  // Prev / Next Chevron buttons state
  const prevBtn = document.getElementById('journal-prev-btn');
  const nextBtn = document.getElementById('journal-next-btn');

  if (prevBtn) {
    prevBtn.disabled = journalCurrentIndex === 0;
    prevBtn.classList.toggle('is-disabled', journalCurrentIndex === 0);
  }
  if (nextBtn) {
    nextBtn.disabled = journalCurrentIndex === JOURNAL_ENTRIES.length - 1;
    nextBtn.classList.toggle('is-disabled', journalCurrentIndex === JOURNAL_ENTRIES.length - 1);
  }

  // Render Body Content with Staggered Word Reveal
  const bodyEl = document.getElementById('journal-entry-body');
  if (bodyEl) {
    let contentHtml = \`<h2 class="journal-entry-title font-serif">\${escapeHtml(currentEntry.title)}</h2>\`;

    // Paragraphs
    if (currentEntry.paragraphs && currentEntry.paragraphs.length > 0) {
      contentHtml += currentEntry.paragraphs.map(p => \`<p class="journal-text-para">\${escapeHtml(p)}</p>\`).join('');
    }

    // Checklists
    if (currentEntry.checklist && currentEntry.checklist.length > 0) {
      contentHtml += \`
        <div class="journal-checklist-box">
          <div class="journal-box-title">Daily Checklist</div>
          \${currentEntry.checklist.map((item, idx) => \`
            <label class="journal-check-row">
              <input type="checkbox" class="journal-task-checkbox" data-idx="\${idx}" \${item.done ? 'checked' : ''}>
              <span class="journal-check-text \${item.done ? 'is-done' : ''}">\${escapeHtml(item.text)}</span>
            </label>
          \`).join('')}
        </div>
      \`;
    }

    // Tables
    if (currentEntry.table && currentEntry.table.length > 0) {
      const keys = Object.keys(currentEntry.table[0]);
      contentHtml += \`
        <div class="journal-table-wrap">
          <table class="journal-data-table">
            <thead>
              <tr>\${keys.map(k => \`<th>\${escapeHtml(k.toUpperCase())}</th>\`).join('')}</tr>
            </thead>
            <tbody>
              \${currentEntry.table.map(row => \`
                <tr>\${keys.map(k => \`<td>\${escapeHtml(row[k])}</td>\`).join('')}</tr>
              \`).join('')}
            </tbody>
          </table>
        </div>
      \`;
    }

    bodyEl.innerHTML = contentHtml;

    // Attach interactive checklist listeners
    bodyEl.querySelectorAll('.journal-task-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-idx'), 10);
        if (currentEntry.checklist && currentEntry.checklist[idx]) {
          currentEntry.checklist[idx].done = e.target.checked;
          const textSpan = e.target.parentElement.querySelector('.journal-check-text');
          if (textSpan) textSpan.classList.toggle('is-done', e.target.checked);
          showToast(e.target.checked ? 'Checklist item completed!' : 'Item marked incomplete');
        }
      });
    });

    // Stagger animation
    gsap.fromTo(bodyEl.children,
      { opacity: 0, y: journalDirection >= 0 ? 8 : -8 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
    );
  }
}

function initJournalNavigation() {
  renderJournalNavigation();

  const prevBtn = document.getElementById('journal-prev-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (journalCurrentIndex > 0) {
        journalDirection = -1;
        journalCurrentIndex--;
        renderJournalNavigation();
      }
    });
  }

  const nextBtn = document.getElementById('journal-next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (journalCurrentIndex < JOURNAL_ENTRIES.length - 1) {
        journalDirection = 1;
        journalCurrentIndex++;
        renderJournalNavigation();
      }
    });
  }

  // Quick Log Entry Input
  const logInput = document.getElementById('journal-quick-input');
  const logSubmit = document.getElementById('journal-log-submit-btn');

  const addLogHandler = () => {
    if (!logInput) return;
    const text = logInput.value.trim();
    if (!text) return;

    const currentEntry = JOURNAL_ENTRIES[journalCurrentIndex];
    if (!currentEntry.checklist) currentEntry.checklist = [];

    // If starts with - [ ] or check item
    if (text.startsWith('- [ ]') || text.startsWith('- [x]')) {
      const isDone = text.startsWith('- [x]');
      const clean = text.replace(/-\s*\[[ x]\]\s*/i, '');
      currentEntry.checklist.push({ text: clean, done: isDone });
    } else {
      if (!currentEntry.paragraphs) currentEntry.paragraphs = [];
      currentEntry.paragraphs.push(text);
    }

    logInput.value = '';
    renderJournalNavigation();
    showToast(\`Logged entry for October \${currentEntry.day}\`);
  };

  if (logSubmit) logSubmit.addEventListener('click', addLogHandler);
  if (logInput) {
    logInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addLogHandler();
      }
    });
  }

  // Mode switcher between Dated Journal and Knowledge Graph
  document.querySelectorAll('#notes-view-mode-pills .notes-mode-pill-tab').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#notes-view-mode-pills .notes-mode-pill-tab').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const mode = pill.getAttribute('data-mode');
      const journalView = document.getElementById('journal-navigation-view');
      const graphView = document.getElementById('tracker-notes-graph-view');

      if (mode === 'journal') {
        if (journalView) journalView.hidden = false;
        if (graphView) graphView.hidden = true;
        renderJournalNavigation();
      } else {
        if (journalView) journalView.hidden = true;
        if (graphView) graphView.hidden = false;
        renderNotesList();
        renderKnowledgeGraph();
      }
    });
  });
}

// ============================================================================
// OBSIDIAN KNOWLEDGE GRAPH & MARKDOWN NOTES WORKSPACE
// ============================================================================

const DEFAULT_NOTES = [
  {
    id: 'note-1',
    title: 'Sprint 12 Architecture & API',
    category: 'Architecture',
    date: '15 Oct 2026',
    content: \`# Sprint 12 Architecture & API

Architecture specs for the distributed real-time sync service.

### Checklist
- [x] Configure WebSocket lease coordinator
- [x] Set up Token Revocation Middleware
- [ ] Connect [[API Authentication]] endpoints
- [ ] Implement dark mode token sync in [[Design System]]

### Service Performance
| Microservice | Target Latency | Status |
| Redis Coordinator | 2.1ms | Operational |
| REST Gateway | 4.8ms | Operational |
| Database Primary | 1.8ms | Operational |

Internal references: [[API Authentication]], [[Design System]], [[Sprint Goals]].\`
  },
  {
    id: 'note-2',
    title: 'Design System & Visual Tokens',
    category: 'Ideas',
    date: '16 Oct 2026',
    content: \`# Design System & Visual Tokens

Warm cream palette guidelines and serif headings for Tracker.

### Checklist
- [x] Cream background (#faf8f5) token
- [x] Peach accent (#e07a5f) highlights
- [ ] Instrument Serif & Inter typography hierarchy
- [ ] Micro-animations for Pomodoro ring

Internal references: [[Sprint 12 Architecture & API]], [[Sprint Goals]].\`
  },
  {
    id: 'note-3',
    title: 'Sprint Goals & Squad Allocations',
    category: 'Sprint',
    date: '17 Oct 2026',
    content: \`# Sprint Goals & Squad Allocations

Sprint 12 delivery targets and squad velocity breakdown.

### Squad Capacities
| Squad | Lead | Pts Committed |
| Frontend | Alex Chen | 23 pts |
| Backend | R. Kumar | 19 pts |
| DevOps | J. Doe | 12 pts |

### Milestones
- [x] Milestone A: Core Kanban & Navigation
- [x] Milestone B: Functional Pomodoro Engine
- [ ] Milestone C: Obsidian Knowledge Graph

Internal references: [[Sprint 12 Architecture & API]], [[Design System]], [[Release QA]].\`
  },
  {
    id: 'note-4',
    title: 'Release QA & Production Readiness',
    category: 'Important',
    date: '18 Oct 2026',
    content: \`# Release QA & Production Readiness

Checklist for deploying Sprint 12 to production environments.

### Pre-Flight Checklist
- [x] Unit test suites passing with 0 failures
- [x] Build check compiles without bundle warnings
- [ ] End-to-end task drag-and-drop verification
- [ ] Accessibility keyboard navigation pass

Internal references: [[API Authentication]], [[Sprint Goals & Squad Allocations]].\`
  }
];

let appNotes = [];
let activeNoteId = 'note-1';
let activeNoteTag = 'all';

function loadNotes() {
  const saved = localStorage.getItem('tracker-notes-data');
  if (saved) {
    try {
      appNotes = JSON.parse(saved);
    } catch (e) {
      appNotes = [...DEFAULT_NOTES];
    }
  } else {
    appNotes = [...DEFAULT_NOTES];
    saveNotes();
  }
}

function saveNotes() {
  localStorage.setItem('tracker-notes-data', JSON.stringify(appNotes));
}

function renderNotesList() {
  const container = document.getElementById('notes-items-list');
  if (!container) return;
  container.innerHTML = '';

  const q = (document.getElementById('notes-search-field')?.value || '').toLowerCase().trim();
  const filtered = appNotes.filter(n => {
    const matchTag = activeNoteTag === 'all' || n.category === activeNoteTag;
    const matchQ = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    return matchTag && matchQ;
  });

  filtered.forEach(note => {
    const card = document.createElement('div');
    const isActive = note.id === activeNoteId;
    card.className = \`note-list-card \${isActive ? 'is-active-note' : ''}\`;
    card.setAttribute('data-id', note.id);

    const preview = note.content.replace(/#+\s+/g, '').replace(/\[\[/g, '').replace(/\]\]/g, '').slice(0, 72) + '...';

    card.innerHTML = \`
      <div class="note-card-top">
        <h4 class="note-card-title font-serif">\${escapeHtml(note.title)}</h4>
        <span class="note-card-badge badge-\${note.category.toLowerCase()}">\${note.category}</span>
      </div>
      <p class="note-card-snippet">\${escapeHtml(preview)}</p>
      <div class="note-card-footer">
        <span class="note-card-date">\${note.date || 'Recent'}</span>
      </div>
    \`;

    card.addEventListener('click', () => {
      activeNoteId = note.id;
      renderNotesList();
      loadActiveNote();
      renderKnowledgeGraph();
    });

    container.appendChild(card);
  });
}

function loadActiveNote() {
  const note = appNotes.find(n => n.id === activeNoteId);
  if (!note) return;

  const titleInput = document.getElementById('note-active-title');
  const categorySelect = document.getElementById('note-active-category');
  const bodyTextarea = document.getElementById('note-active-body');

  if (titleInput) titleInput.value = note.title;
  if (categorySelect) categorySelect.value = note.category;
  if (bodyTextarea) bodyTextarea.value = note.content;

  renderActiveNotePreview(note.content);
}

function renderActiveNotePreview(rawContent) {
  const preview = document.getElementById('note-active-rendered');
  if (!preview) return;

  let html = rawContent;

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="preview-h3 font-serif">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="preview-h2 font-serif">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="preview-h1 font-serif">$1</h1>');

  // Bold & Italics
  html = html.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
  html = html.replace(/\\*(.*?)\\*/g, '<em>$1</em>');

  // Checklists (- [x] or - [ ])
  html = html.replace(/^-\\s*\\[(x|X)\\]\\s*(.*$)/gim, '<div class="preview-checklist-item is-checked"><input type="checkbox" checked disabled> <span>$2</span></div>');
  html = html.replace(/^-\\s*\\[ \\]\\s*(.*$)/gim, '<div class="preview-checklist-item"><input type="checkbox" disabled> <span>$1</span></div>');

  // Obsidian [[Internal Link]] pills
  html = html.replace(/\\[\\[([^\\]]+)\\]\\]/g, '<span class="obsidian-link-pill" data-link="$1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> <span>$1</span></span>');

  // Tables
  html = html.replace(/\\|(.+)\\|/g, (match) => {
    const cells = match.split('|').filter(c => c.trim().length > 0);
    if (cells.some(c => c.includes('---'))) {
      return ''; // divider row
    }
    const tdCells = cells.map(c => \`<td>\${c.trim()}</td>\`).join('');
    return \`<tr>\${tdCells}</tr>\`;
  });
  html = html.replace(/(<tr>.*?<\\/tr>\\s*)+/gs, '<div class="preview-table-wrap"><table class="preview-table"><tbody>$&</tbody></table></div>');

  // Paragraph breaks
  html = html.replace(/\\n\\n+/g, '<br><br>');

  preview.innerHTML = html;

  // Make [[Internal Link]] clickable
  preview.querySelectorAll('.obsidian-link-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const targetName = pill.getAttribute('data-link');
      const targetNote = appNotes.find(n => n.title.toLowerCase().includes(targetName.toLowerCase()));
      if (targetNote) {
        activeNoteId = targetNote.id;
        renderNotesList();
        loadActiveNote();
        renderKnowledgeGraph();
        showToast(\`Navigated to: \${targetNote.title}\`);
      } else {
        showToast(\`Internal Link: \${targetName}\`);
      }
    });
  });
}

function initNotesWorkspace() {
  loadNotes();
  initJournalNavigation();
  renderNotesList();
  loadActiveNote();

  // Search input
  const searchInput = document.getElementById('notes-search-field');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderNotesList();
    });
  }

  // Tags filter bar
  document.querySelectorAll('#notes-tags-bar .notes-tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#notes-tags-bar .notes-tag-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeNoteTag = chip.getAttribute('data-tag');
      renderNotesList();
    });
  });

  // Editor typing & Auto-save
  const titleInput = document.getElementById('note-active-title');
  const categorySelect = document.getElementById('note-active-category');
  const bodyTextarea = document.getElementById('note-active-body');
  const saveStatus = document.getElementById('note-save-status');

  function saveCurrentNote() {
    const note = appNotes.find(n => n.id === activeNoteId);
    if (!note) return;

    if (titleInput) note.title = titleInput.value || 'Untitled Note';
    if (categorySelect) note.category = categorySelect.value;
    if (bodyTextarea) note.content = bodyTextarea.value;

    saveNotes();
    if (saveStatus) {
      saveStatus.textContent = 'Saved';
      saveStatus.classList.add('status-saved');
    }
    renderActiveNotePreview(note.content);
    renderNotesList();
    renderKnowledgeGraph();
  }

  let saveTimer = null;
  const triggerDebouncedSave = () => {
    if (saveStatus) {
      saveStatus.textContent = 'Editing...';
      saveStatus.classList.remove('status-saved');
    }
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveCurrentNote, 400);
  };

  if (titleInput) titleInput.addEventListener('input', triggerDebouncedSave);
  if (categorySelect) categorySelect.addEventListener('change', triggerDebouncedSave);
  if (bodyTextarea) bodyTextarea.addEventListener('input', triggerDebouncedSave);

  // New Note CTA
  const newNoteBtn = document.getElementById('notes-new-btn');
  if (newNoteBtn) {
    newNoteBtn.addEventListener('click', () => {
      const nextId = \`note-\${Date.now()}\`;
      const newNote = {
        id: nextId,
        title: 'New Interconnected Note',
        category: 'Ideas',
        date: 'Today',
        content: \`# New Interconnected Note

Document ideas, architecture, and team specs here.

### Checklist
- [ ] First task
- [ ] Connect with [[Sprint 12 Architecture & API]]

Internal references: [[Design System & Visual Tokens]].\`
      };
      appNotes.unshift(newNote);
      activeNoteId = nextId;
      saveNotes();
      renderNotesList();
      loadActiveNote();
      renderKnowledgeGraph();
      showToast('Created new connected note');
      if (titleInput) setTimeout(() => { titleInput.focus(); titleInput.select(); }, 100);
    });
  }

  // Editor Formatting Buttons
  document.querySelectorAll('.editor-tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!bodyTextarea) return;
      const type = btn.getAttribute('data-insert');
      const start = bodyTextarea.selectionStart;
      const end = bodyTextarea.selectionEnd;
      const text = bodyTextarea.value;

      let insert = '';
      if (type === 'bold') insert = '**bold text**';
      else if (type === 'italic') insert = '*italic text*';
      else if (type === 'heading') insert = '\\n### Subheading\\n';
      else if (type === 'checklist') insert = '\\n- [ ] New checklist item';
      else if (type === 'table') insert = '\\n| Feature | Status | Lead |\\n| API Endpoints | Ready | Alex |\\n| DB Indexes | Done | Raj |\\n';
      else if (type === 'link') insert = '[[API Authentication]]';

      bodyTextarea.value = text.substring(0, start) + insert + text.substring(end);
      bodyTextarea.focus();
      triggerDebouncedSave();
    });
  });

  // Knowledge Graph Reset Button
  const resetGraphBtn = document.getElementById('graph-reset-btn');
  if (resetGraphBtn) {
    resetGraphBtn.addEventListener('click', () => {
      renderKnowledgeGraph();
      showToast('Recentered Obsidian Knowledge Graph');
    });
  }
}
`;

// Now replace the calendar & notes code section
const before = content.substring(0, calStartIdx);
const after = content.substring(notesGraphStartIdx);

// Append the graphCode if needed or use the complete clean replacement
content = before + newCalendarAndJournalCode + '\n' + graphCode + '\n' + after;

fs.writeFileSync(mainPath, content, 'utf8');
console.log('Successfully updated src/main.js with SubscriptionCalendar & JournalNavigation!');
