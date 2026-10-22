const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// 1. Identify start of actual-app-view
const startMarker = '<div class="actual-app-view" id="actual-app-view" hidden>';
const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
  console.error('Could not find startMarker');
  process.exit(1);
}

// 2. Identify start of full timer view
const endText = 'FULL CLOCKIT POMODORO TIMER VIEW';
let idx = content.indexOf(endText);
if (idx === -1) {
  console.error('Could not find endText');
  process.exit(1);
}
let endIndex = content.lastIndexOf('<!--', idx);
if (endIndex === -1) {
  console.error('Could not find comment start before endText');
  process.exit(1);
}

const newAppHtml = `<div class="actual-app-view" id="actual-app-view">
    <div class="tracker-container">
      <!-- Tracker Top Global Navigation Bar (Matching Reference Design) -->
      <header class="tracker-top-bar" id="tracker-top-bar">
        <div class="tracker-brand-group">
          <div class="tracker-logo-circle" aria-hidden="true">
            <span class="tracker-logo-dot"></span>
          </div>
          <span class="tracker-brand-title">Tracker</span>
        </div>

        <nav class="tracker-pill-tabs" id="tracker-top-pills" role="tablist" aria-label="Application navigation">
          <button class="tracker-pill-tab active" data-view="dashboard" role="tab" aria-selected="true" type="button">Overview</button>
          <button class="tracker-pill-tab" data-view="tasks" role="tab" aria-selected="false" type="button">Tasks</button>
          <button class="tracker-pill-tab" data-view="calendar" role="tab" aria-selected="false" type="button">Calendar</button>
          <button class="tracker-pill-tab" data-view="notes" role="tab" aria-selected="false" type="button">Notes</button>
          <button class="tracker-pill-tab" data-view="timer" role="tab" aria-selected="false" type="button">Timer</button>
          <button class="tracker-pill-tab" data-view="reports" role="tab" aria-selected="false" type="button">Reports</button>
          <button class="tracker-pill-tab" data-action="settings" role="tab" aria-selected="false" type="button">Settings</button>
        </nav>

        <div class="tracker-top-actions">
          <button class="tracker-circle-action-btn" id="tracker-search-trigger" type="button" aria-label="Search tasks" title="Search tasks ( / )">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
          <button class="tracker-circle-action-btn tracker-notif-btn" id="tracker-notif-trigger" type="button" aria-label="Notifications" title="1 new notification">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <span class="tracker-notif-badge">1</span>
          </button>

          <div class="tracker-user-profile-wrap">
            <button class="tracker-user-pill-btn" id="clockit-user-btn" type="button" aria-haspopup="true" aria-expanded="false" title="Alex Chen • alex@tracker.dev">
              <div class="tracker-user-avatar">A</div>
              <div class="tracker-user-meta">
                <span class="tracker-user-name">Alex Chen</span>
                <span class="tracker-user-email">alex@tracker.dev</span>
              </div>
              <svg class="tracker-chevron-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="clockit-user-dropdown" id="clockit-user-dropdown">
              <div class="dropdown-header">
                <strong>Alex Chen</strong>
                <span>Staff Engineer &bull; alex@tracker.dev</span>
              </div>
              <button class="dropdown-item" id="app-theme-toggle-btn" type="button">Toggle Theme (Light / Dark)</button>
              <button class="dropdown-item" id="app-open-settings-item" type="button">Timer Preferences</button>
              <button class="dropdown-item" id="app-exit-view-btn" type="button">&larr; Back to Website</button>
              <button class="dropdown-item danger" id="app-signout-action-btn" type="button">Sign Out</button>
            </div>
          </div>
        </div>
      </header>

      <!-- App Shell with Left Sidebar & Main Content -->
      <div class="tracker-app-shell">
        <!-- Left Sidebar Navigation (Matching Reference Design) -->
        <aside class="tracker-sidebar" id="tracker-sidebar" aria-label="Sidebar navigation">
          <nav class="tracker-sidebar-nav">
            <button class="tracker-sidebar-item active" data-view="dashboard" type="button" title="Sprint Overview">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>Home</span>
            </button>
            <button class="tracker-sidebar-item" data-view="tasks" type="button" title="Tasks &amp; Issues">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              <span>Issues</span>
            </button>
            <button class="tracker-sidebar-item" data-view="calendar" type="button" title="Sprint Calendar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Sprints</span>
            </button>
            <button class="tracker-sidebar-item" data-view="notes" type="button" title="Knowledge Notes &amp; Graph">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              <span>Roadmap</span>
            </button>
            <button class="tracker-sidebar-item" data-view="timer" type="button" title="Focus Timer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Timer</span>
            </button>
            <button class="tracker-sidebar-item" data-view="reports" type="button" title="Velocity &amp; Analytics">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              <span>Reports</span>
            </button>
            <button class="tracker-sidebar-item" data-action="settings" type="button" title="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        <!-- Main Content Area -->
        <main class="tracker-main-area">
          <!-- ==================================================================
               VIEW 1: DASHBOARD (Overview)
               Matches the attached Tracker reference design perfectly!
               ================================================================== -->
          <div class="tracker-view active" id="tracker-view-dashboard">
            <!-- Header Row: Sprint Overview Title, Greeting & Live Clock, + New Issue -->
            <div class="tracker-view-header">
              <div class="header-titles">
                <h1 class="tracker-page-title font-serif">Sprint Overview</h1>
                <p class="tracker-page-subtitle">Your team's work, all in one place.</p>
              </div>

              <div class="header-right-tools">
                <!-- Greeting & Animated Digital Clock Card -->
                <div class="tracker-clock-pill" title="Live Clock &amp; Date">
                  <div class="clock-pill-date" id="clockit-live-date">WED, 15 OCT 2026</div>
                  <div class="clock-pill-time">
                    <span class="digits" id="clockit-time-digits">08 : 24</span>
                    <span class="ampm" id="clockit-time-ampm">PM</span>
                  </div>
                  <div class="clock-pill-greeting" id="clockit-greeting-text">Good evening, Ashay.</div>
                </div>

                <button class="tracker-new-issue-btn" id="app-new-task-btn" type="button">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span>New issue</span>
                </button>
              </div>
            </div>

            <!-- Top Cards Row: Sprint At A Glance & Sprint Health -->
            <div class="tracker-glance-health-row">
              <!-- Left Card: Sprint at a glance -->
              <div class="tracker-card glance-card">
                <div class="card-top-meta">
                  <div>
                    <h3 class="card-heading">Sprint at a glance</h3>
                    <span class="card-sub-info">Sprint 12 &bull; 14 Oct &ndash; 27 Oct 2026</span>
                  </div>
                  <div class="sprint-countdown-badge">
                    <span class="countdown-text">10 days left</span>
                    <div class="mini-bar-track"><div class="mini-bar-fill" style="width: 58%;"></div></div>
                  </div>
                </div>

                <div class="glance-card-content">
                  <div class="glance-metrics-col">
                    <div class="glance-metrics-row">
                      <div class="metric-item">
                        <div class="metric-number"><span id="sprint-pts-completed">42</span> <span class="pts-unit">pts</span></div>
                        <div class="metric-label">Completed</div>
                      </div>
                      <div class="metric-item">
                        <div class="metric-number"><span id="sprint-pts-inprog">18</span> <span class="pts-unit">pts</span></div>
                        <div class="metric-label">In progress</div>
                      </div>
                      <div class="metric-item">
                        <div class="metric-number"><span id="sprint-pts-remaining">12</span> <span class="pts-unit">pts</span></div>
                        <div class="metric-label">Remaining</div>
                      </div>
                    </div>
                    <div class="metric-trend-tag">
                      <span class="trend-arrow">&uarr;</span> 12% from last sprint
                    </div>
                  </div>

                  <!-- Stacked Bar Chart by Days of Week -->
                  <div class="glance-chart-col">
                    <div class="chart-legend-row">
                      <span class="legend-chip"><span class="chip-dot dot-completed"></span> Completed</span>
                      <span class="legend-chip"><span class="chip-dot dot-planned"></span> Planned</span>
                    </div>
                    <div class="stacked-bars-row" id="sprint-stacked-bars">
                      <div class="bar-day-col"><div class="stacked-bar"><div class="bar-segment planned" style="height: 18px;"></div><div class="bar-segment completed" style="height: 12px;"></div></div><span class="day-label">Mon</span></div>
                      <div class="bar-day-col"><div class="stacked-bar"><div class="bar-segment planned" style="height: 24px;"></div><div class="bar-segment completed" style="height: 28px;"></div></div><span class="day-label">Tue</span></div>
                      <div class="bar-day-col"><div class="stacked-bar"><div class="bar-segment planned" style="height: 16px;"></div><div class="bar-segment completed" style="height: 36px;"></div></div><span class="day-label">Wed</span></div>
                      <div class="bar-day-col"><div class="stacked-bar"><div class="bar-segment planned" style="height: 20px;"></div><div class="bar-segment completed" style="height: 30px;"></div></div><span class="day-label">Thu</span></div>
                      <div class="bar-day-col"><div class="stacked-bar"><div class="bar-segment planned" style="height: 32px;"></div><div class="bar-segment completed" style="height: 26px;"></div></div><span class="day-label">Fri</span></div>
                      <div class="bar-day-col"><div class="stacked-bar"><div class="bar-segment planned" style="height: 14px;"></div><div class="bar-segment completed" style="height: 4px;"></div></div><span class="day-label">Sat</span></div>
                      <div class="bar-day-col"><div class="stacked-bar"><div class="bar-segment planned" style="height: 20px;"></div><div class="bar-segment completed" style="height: 0px;"></div></div><span class="day-label">Sun</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Card: Sprint health (Today's progress card with completion percentage) -->
              <div class="tracker-card health-card">
                <div class="card-top-meta">
                  <h3 class="card-heading">Sprint health</h3>
                </div>

                <div class="health-status-badge">
                  <span class="health-pulse-dot"></span>
                  <div class="health-badge-text">
                    <strong>On track</strong>
                    <span>Team is moving well and on target to complete the sprint.</span>
                  </div>
                </div>

                <div class="health-card-body">
                  <div class="health-donut-wrap">
                    <svg class="health-donut-svg" viewBox="0 0 36 36">
                      <path class="health-donut-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="3.5" />
                      <path class="health-donut-fill" id="clockit-donut-fill" stroke-dasharray="88, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" stroke-width="3.5" stroke-linecap="round" />
                    </svg>
                    <div class="health-donut-center">
                      <span class="health-pct-text" id="clockit-progress-pct">88%</span>
                      <span class="health-pct-sub">On track</span>
                    </div>
                  </div>

                  <div class="health-breakdown-list">
                    <div class="health-item">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                      <strong><span id="sprint-total-pts">54</span> pts</strong>
                      <span class="label">Total scope</span>
                    </div>
                    <div class="health-item">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <strong><span id="sprint-completed-pts-sub">42</span> pts</strong>
                      <span class="label">Completed (<span id="sprint-completed-pct-sub">78%</span>)</span>
                    </div>
                    <div class="health-item">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      <strong><span id="sprint-remaining-pts-sub">12</span> pts</strong>
                      <span class="label">Remaining (<span id="sprint-remaining-pct-sub">22%</span>)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Second Row: Focus Pomodoro Timer & Quick Notes & Backlog Count -->
            <div class="tracker-widgets-row">
              <!-- Animated Pomodoro Timer Card with Play/Pause and Reset -->
              <div class="tracker-card timer-summary-card" id="clockit-dashboard-timer-card">
                <div class="card-top-meta">
                  <div class="timer-title-group">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e07a5f" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 class="card-heading">Focus Timer</h3>
                    <span class="timer-mode-tag" id="clockit-card-mode-badge">Focus</span>
                  </div>
                  <button class="timer-expand-btn" id="clockit-timer-expand-btn" type="button" title="Open Full Pomodoro Timer View">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                  </button>
                </div>
                <div class="timer-summary-body">
                  <div class="timer-digits-wrap">
                    <div class="timer-countdown-digits font-serif" id="clockit-timer-display">25 : 00</div>
                    <div class="timer-sub-motto" id="clockit-timer-sub">Get things done.</div>
                  </div>
                  <div class="timer-summary-controls">
                    <!-- Mini circular progress ring -->
                    <div class="timer-mini-ring-wrap" title="Session progress">
                      <svg class="timer-mini-progress-svg" viewBox="0 0 48 48">
                        <circle class="mini-progress-bg" cx="24" cy="24" r="20" fill="none" stroke="rgba(224, 122, 95, 0.16)" stroke-width="3.5" />
                        <circle class="mini-progress-fill" id="clockit-card-progress-fill" cx="24" cy="24" r="20" fill="none" stroke="#e07a5f" stroke-width="3.5" stroke-dasharray="125.66" stroke-dashoffset="0" stroke-linecap="round" />
                      </svg>
                      <button class="timer-play-btn" id="clockit-timer-btn" type="button" aria-label="Play or pause focus timer" title="Start Timer (Space)">
                        <svg class="timer-play-icon" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
                        <svg class="timer-pause-icon" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                      </button>
                    </div>

                    <!-- Reset Button -->
                    <button class="timer-reset-btn" id="clockit-timer-card-reset-btn" type="button" aria-label="Reset timer" title="Reset Session (R)">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Backlog Count Card -->
              <div class="tracker-card backlog-summary-card">
                <div class="card-top-meta">
                  <div class="timer-title-group">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                    <h3 class="card-heading">Backlog</h3>
                  </div>
                  <button class="summary-more-btn" id="jump-to-backlog-btn" type="button" title="View backlog ideas">&rarr;</button>
                </div>
                <div class="backlog-card-body">
                  <div class="backlog-number-display" id="clockit-backlog-count">3</div>
                  <div class="backlog-sub-text">ideas queued for sprint</div>
                </div>
              </div>

              <!-- Quick Notes Panel Card -->
              <div class="tracker-card quicknotes-summary-card">
                <div class="card-top-meta">
                  <div class="timer-title-group">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e07a5f" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                    <h3 class="card-heading">Quick Notes</h3>
                  </div>
                  <button class="summary-more-btn" id="expand-notes-page-btn" type="button" title="Open full Notes &amp; Knowledge Graph view">&rarr;</button>
                </div>
                <div class="quicknotes-card-body">
                  <form class="notes-input-form" id="clockit-notes-form">
                    <input type="text" class="notes-text-input" id="clockit-new-note-input" placeholder="Write something &amp; press Enter..." autocomplete="off">
                  </form>
                  <div class="notes-items-list" id="clockit-notes-list">
                    <!-- Note items -->
                  </div>
                </div>
              </div>
            </div>

            <!-- Board Controls: Filter pills & Search input -->
            <div class="tracker-filter-bar">
              <div class="filter-pills-group" id="dashboard-filter-pills">
                <button class="filter-pill active" data-filter="all" type="button">All issues</button>
                <button class="filter-pill" data-filter="my" type="button">My issues</button>
                <button class="filter-pill" data-filter="inprogress" type="button">In progress</button>
                <button class="filter-pill" data-filter="review" type="button">In review</button>
              </div>

              <div class="filter-search-group">
                <div class="search-input-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text" class="tracker-search-input" id="app-task-search-input" placeholder="Search issues...">
                </div>
                <button class="filter-action-icon-btn" id="app-filter-toggle-btn" type="button" title="Filter options">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                </button>
              </div>
            </div>

            <!-- Four-Column Kanban Board (Matches reference design) -->
            <div class="tracker-kanban-board-wrap">
              <div class="clockit-kanban-columns" id="app-kanban-board">
                <!-- Col 1: Backlog -->
                <div class="app-board-col" data-col="todo">
                  <div class="clockit-col-header">
                    <div class="col-indicator-wrap">
                      <span class="status-dot dot-todo"></span>
                      <span class="col-title-text">Backlog</span>
                    </div>
                    <div class="col-header-right">
                      <span class="col-count-bubble" id="app-count-todo">3</span>
                      <button class="col-more-btn" type="button" aria-label="Column options">&bull;&bull;&bull;</button>
                    </div>
                  </div>
                  <div class="app-cards-container" id="app-cards-todo"></div>
                </div>

                <!-- Col 2: In Progress -->
                <div class="app-board-col" data-col="inprogress">
                  <div class="clockit-col-header">
                    <div class="col-indicator-wrap">
                      <span class="status-dot dot-inprogress"></span>
                      <span class="col-title-text">In Progress</span>
                    </div>
                    <div class="col-header-right">
                      <span class="col-count-bubble" id="app-count-inprogress">3</span>
                      <button class="col-more-btn" type="button" aria-label="Column options">&bull;&bull;&bull;</button>
                    </div>
                  </div>
                  <div class="app-cards-container" id="app-cards-inprogress"></div>
                </div>

                <!-- Col 3: In Review -->
                <div class="app-board-col" data-col="review">
                  <div class="clockit-col-header">
                    <div class="col-indicator-wrap">
                      <span class="status-dot dot-review"></span>
                      <span class="col-title-text">In Review</span>
                    </div>
                    <div class="col-header-right">
                      <span class="col-count-bubble" id="app-count-review">2</span>
                      <button class="col-more-btn" type="button" aria-label="Column options">&bull;&bull;&bull;</button>
                    </div>
                  </div>
                  <div class="app-cards-container" id="app-cards-review"></div>
                </div>

                <!-- Col 4: Done & Merged -->
                <div class="app-board-col" data-col="done">
                  <div class="clockit-col-header">
                    <div class="col-indicator-wrap">
                      <span class="status-dot dot-done"></span>
                      <span class="col-title-text">Done &amp; Merged</span>
                    </div>
                    <div class="col-header-right">
                      <span class="col-count-bubble" id="app-count-done">4</span>
                      <button class="col-more-btn" type="button" aria-label="Column options">&bull;&bull;&bull;</button>
                    </div>
                  </div>
                  <div class="app-cards-container" id="app-cards-done"></div>
                </div>
              </div>
            </div>
          </div><!-- /tracker-view-dashboard -->

          <!-- ==================================================================
               VIEW 2: TASKS (Functional Kanban with Creation, Edit, & Status)
               ================================================================== -->
          <div class="tracker-view" id="tracker-view-tasks" hidden>
            <div class="tracker-view-header">
              <div class="header-titles">
                <h1 class="tracker-page-title font-serif">Tasks &amp; Sprint Board</h1>
                <p class="tracker-page-subtitle">Create, edit, drag, and update status of sprint issues.</p>
              </div>
              <div class="header-right-tools">
                <button class="tracker-new-issue-btn" id="tasks-page-create-btn" type="button">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span>New task</span>
                </button>
              </div>
            </div>

            <!-- Tasks Filter Bar -->
            <div class="tracker-filter-bar">
              <div class="filter-pills-group" id="tasks-page-filter-pills">
                <button class="filter-pill active" data-filter="all" type="button">All issues</button>
                <button class="filter-pill" data-filter="my" type="button">My issues</button>
                <button class="filter-pill" data-filter="inprogress" type="button">In progress</button>
                <button class="filter-pill" data-filter="review" type="button">In review</button>
              </div>
              <div class="filter-search-group">
                <div class="search-input-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text" class="tracker-search-input" id="tasks-page-search-input" placeholder="Search tasks...">
                </div>
                <select class="tracker-select-input" id="tasks-page-squad-select">
                  <option value="all">All Squads</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="UI/UX">UI/UX</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Product">Product</option>
                  <option value="Testing">Testing</option>
                  <option value="Documentation">Documentation</option>
                </select>
              </div>
            </div>

            <!-- Tasks Full Board Target -->
            <div class="tracker-kanban-board-wrap">
              <div class="clockit-kanban-columns" id="tasks-page-board"></div>
            </div>
          </div><!-- /tracker-view-tasks -->

          <!-- ==================================================================
               VIEW 3: CALENDAR (Weekly View Displaying Tasks and Deadlines)
               ================================================================== -->
          <div class="tracker-view" id="tracker-view-calendar" hidden>
            <div class="tracker-view-header">
              <div class="header-titles">
                <h1 class="tracker-page-title font-serif">Sprint Calendar</h1>
                <p class="tracker-page-subtitle">Weekly view of scheduled tasks, deadlines, and milestones.</p>
              </div>
              <div class="header-right-tools">
                <div class="calendar-nav-buttons">
                  <button class="pill-btn-ghost-sm" id="cal-prev-btn" type="button">&larr; Prev</button>
                  <span class="cal-week-badge">19 Oct &ndash; 25 Oct 2026 (Active)</span>
                  <button class="pill-btn-ghost-sm" id="cal-next-btn" type="button">Next &rarr;</button>
                </div>
              </div>
            </div>

            <!-- Calendar Weekly Columns Grid -->
            <div class="tracker-calendar-grid" id="tracker-calendar-grid">
              <!-- Monday -->
              <div class="cal-day-col" data-day="Mon">
                <div class="cal-day-header">
                  <span class="cal-day-name">Monday</span>
                  <span class="cal-day-date">19 Oct</span>
                </div>
                <div class="cal-tasks-list" id="cal-tasks-Mon"></div>
                <button class="cal-add-deadline-btn" data-day="Mon" type="button">+ Add deadline</button>
              </div>

              <!-- Tuesday -->
              <div class="cal-day-col" data-day="Tue">
                <div class="cal-day-header">
                  <span class="cal-day-name">Tuesday</span>
                  <span class="cal-day-date">20 Oct</span>
                </div>
                <div class="cal-tasks-list" id="cal-tasks-Tue"></div>
                <button class="cal-add-deadline-btn" data-day="Tue" type="button">+ Add deadline</button>
              </div>

              <!-- Wednesday (Today) -->
              <div class="cal-day-col is-today" data-day="Wed">
                <div class="cal-day-header">
                  <span class="cal-day-name">Wednesday</span>
                  <span class="cal-day-date">21 Oct <span class="today-chip">Today</span></span>
                </div>
                <div class="cal-tasks-list" id="cal-tasks-Wed"></div>
                <button class="cal-add-deadline-btn" data-day="Wed" type="button">+ Add deadline</button>
              </div>

              <!-- Thursday -->
              <div class="cal-day-col" data-day="Thu">
                <div class="cal-day-header">
                  <span class="cal-day-name">Thursday</span>
                  <span class="cal-day-date">22 Oct</span>
                </div>
                <div class="cal-tasks-list" id="cal-tasks-Thu"></div>
                <button class="cal-add-deadline-btn" data-day="Thu" type="button">+ Add deadline</button>
              </div>

              <!-- Friday -->
              <div class="cal-day-col" data-day="Fri">
                <div class="cal-day-header">
                  <span class="cal-day-name">Friday</span>
                  <span class="cal-day-date">23 Oct</span>
                </div>
                <div class="cal-tasks-list" id="cal-tasks-Fri"></div>
                <button class="cal-add-deadline-btn" data-day="Fri" type="button">+ Add deadline</button>
              </div>

              <!-- Saturday -->
              <div class="cal-day-col is-weekend" data-day="Sat">
                <div class="cal-day-header">
                  <span class="cal-day-name">Saturday</span>
                  <span class="cal-day-date">24 Oct</span>
                </div>
                <div class="cal-tasks-list" id="cal-tasks-Sat"></div>
                <button class="cal-add-deadline-btn" data-day="Sat" type="button">+ Add deadline</button>
              </div>

              <!-- Sunday -->
              <div class="cal-day-col is-weekend" data-day="Sun">
                <div class="cal-day-header">
                  <span class="cal-day-name">Sunday</span>
                  <span class="cal-day-date">25 Oct</span>
                </div>
                <div class="cal-tasks-list" id="cal-tasks-Sun"></div>
                <button class="cal-add-deadline-btn" data-day="Sun" type="button">+ Add deadline</button>
              </div>
            </div>
          </div><!-- /tracker-view-calendar -->

          <!-- ==================================================================
               VIEW 4: NOTES (Notes List, Editor, & Obsidian Knowledge Graph)
               ================================================================== -->
          <div class="tracker-view" id="tracker-view-notes" hidden>
            <div class="tracker-view-header">
              <div class="header-titles">
                <h1 class="tracker-page-title font-serif">Project Notes &amp; Knowledge Graph</h1>
                <p class="tracker-page-subtitle">Obsidian-style interconnected documentation with straight graph connections.</p>
              </div>
              <div class="header-right-tools">
                <button class="tracker-new-issue-btn" id="notes-new-btn" type="button">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span>New note</span>
                </button>
              </div>
            </div>

            <!-- Notes 3-Panel Split Workspace -->
            <div class="tracker-notes-container">
              <!-- Panel 1: Notes List (Left) -->
              <aside class="notes-list-col">
                <div class="notes-search-wrap">
                  <input type="text" class="notes-search-input" id="notes-search-field" placeholder="Search notes...">
                </div>
                <div class="notes-tags-bar" id="notes-tags-bar">
                  <button class="notes-tag-chip active" data-tag="all" type="button">All</button>
                  <button class="notes-tag-chip" data-tag="Architecture" type="button">Architecture</button>
                  <button class="notes-tag-chip" data-tag="Ideas" type="button">Ideas</button>
                  <button class="notes-tag-chip" data-tag="Sprint" type="button">Sprint</button>
                  <button class="notes-tag-chip" data-tag="Important" type="button">Important</button>
                </div>
                <div class="notes-cards-list" id="notes-items-list">
                  <!-- Rendered dynamically -->
                </div>
              </aside>

              <!-- Panel 2: Editor (Middle) -->
              <section class="notes-editor-col">
                <div class="editor-header-bar">
                  <input type="text" class="note-title-input font-serif" id="note-active-title" placeholder="Note Title...">
                  <div class="note-meta-row">
                    <select class="note-category-select" id="note-active-category">
                      <option value="Architecture">Architecture</option>
                      <option value="Ideas">Ideas</option>
                      <option value="Sprint">Sprint</option>
                      <option value="Important">Important</option>
                      <option value="Random">Random</option>
                    </select>
                    <span class="note-save-status" id="note-save-status">Saved</span>
                  </div>
                </div>

                <!-- Markdown & Rich Elements Toolbar -->
                <div class="editor-toolbar">
                  <button class="editor-tool-btn" data-insert="bold" type="button" title="Bold (**text**)"><b>B</b></button>
                  <button class="editor-tool-btn" data-insert="italic" type="button" title="Italic (*text*)"><i>I</i></button>
                  <button class="editor-tool-btn" data-insert="heading" type="button" title="Heading (### Title)">H3</button>
                  <span class="editor-tool-divider"></span>
                  <button class="editor-tool-btn" data-insert="checklist" type="button" title="Checklist item (- [ ] Task)">&#9745; Checklist</button>
                  <button class="editor-tool-btn" data-insert="table" type="button" title="Insert Markdown Table">&#9638; Table</button>
                  <button class="editor-tool-btn" data-insert="link" type="button" title="Insert Internal Link ([[Note]])">&#128279; [[Link]]</button>
                </div>

                <!-- Dual Live Editor / Rendered Area -->
                <div class="editor-split-body">
                  <textarea class="note-raw-textarea" id="note-active-body" placeholder="Write formatted notes, checklists (- [ ] task), tables (| Col |), and internal links ([[Topic]])..."></textarea>
                  <div class="note-preview-pane" id="note-active-rendered" aria-label="Rendered preview">
                    <!-- Live interactive rendered note with clickable checklists, tables, and internal links -->
                  </div>
                </div>
              </section>

              <!-- Panel 3: Obsidian Knowledge Graph (Right) -->
              <aside class="notes-graph-col">
                <div class="graph-col-header">
                  <div class="graph-title-group">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    <span>Knowledge Graph</span>
                  </div>
                  <button class="graph-reset-btn" id="graph-reset-btn" type="button" title="Recenter Graph">&#8635; Reset</button>
                </div>
                <div class="graph-svg-wrapper" id="graph-svg-wrapper">
                  <svg class="knowledge-graph-svg" id="knowledge-graph-svg" viewBox="0 0 380 440" preserveAspectRatio="xMidYMid meet">
                    <!-- Straight connecting lines and circular nodes dynamically rendered by JS -->
                  </svg>
                </div>
                <div class="graph-footer-hint">
                  <div class="graph-legend-dots">
                    <span class="legend-chip"><span class="chip-dot dot-note"></span> Notes</span>
                    <span class="legend-chip"><span class="chip-dot dot-link"></span> [[Links]]</span>
                  </div>
                  <span class="legend-text">Straight lines connect related notes. Click any node to open.</span>
                </div>
              </aside>
            </div>
          </div><!-- /tracker-view-notes -->

          <!-- ==================================================================
               VIEW 5: REPORTS (Velocity & Scope Analytics)
               ================================================================== -->
          <div class="tracker-view" id="tracker-view-reports" hidden>
            <div class="tracker-view-header">
              <div class="header-titles">
                <h1 class="tracker-page-title font-serif">Sprint Reports &amp; Velocity</h1>
                <p class="tracker-page-subtitle">Track team velocity, burndown progress, and squad point distribution.</p>
              </div>
            </div>

            <div class="tracker-reports-grid">
              <div class="tracker-card report-stat-card">
                <h3 class="card-heading">Sprint 12 Velocity</h3>
                <div class="velocity-huge-number">42 <span class="unit">pts completed</span></div>
                <p class="velocity-sub">Planned scope: 54 pts &bull; Current velocity: 4.2 pts/day</p>
                <div class="velocity-progress-bar"><div class="velocity-fill" style="width: 78%;"></div></div>
              </div>

              <div class="tracker-card report-squad-card">
                <h3 class="card-heading">Points by Squad</h3>
                <div class="squad-breakdown-table">
                  <div class="squad-row"><span class="app-squad-tag Frontend">Frontend</span> <strong>18 pts</strong> <span class="bar-fill" style="width: 50%;"></span></div>
                  <div class="squad-row"><span class="app-squad-tag Backend">Backend</span> <strong>16 pts</strong> <span class="bar-fill" style="width: 44%;"></span></div>
                  <div class="squad-row"><span class="app-squad-tag UI/UX">UI/UX</span> <strong>11 pts</strong> <span class="bar-fill" style="width: 32%;"></span></div>
                  <div class="squad-row"><span class="app-squad-tag DevOps">DevOps</span> <strong>6 pts</strong> <span class="bar-fill" style="width: 18%;"></span></div>
                  <div class="squad-row"><span class="app-squad-tag Testing">Testing</span> <strong>3 pts</strong> <span class="bar-fill" style="width: 10%;"></span></div>
                </div>
              </div>
            </div>
          </div><!-- /tracker-view-reports -->

          <!-- ==================================================================
               VIEW 6: TIMER VIEW (Wraps Existing Mountain Pomodoro Engine)
               ================================================================== -->
          <div class="tracker-view" id="tracker-view-timer" hidden>`;

content = content.substring(0, startIndex) + newAppHtml + '\n' + content.substring(endIndex);

// Wrap end of clockit-timer-view
const timerCloseTarget = '</section>\n    </div>\n\n    <!-- Quick Create Task Modal inside App -->';
const timerCloseTargetAlt = '</section>\r\n    </div>\r\n\r\n    <!-- Quick Create Task Modal inside App -->';
let timerClosePos = content.indexOf('<!-- Quick Create Task Modal inside App -->');
if (timerClosePos !== -1) {
  // Find </section> right before it
  let secClose = content.lastIndexOf('</section>', timerClosePos);
  if (secClose !== -1) {
    const afterSec = content.substring(secClose + 10, timerClosePos);
    const replacementCloses = `
          </div><!-- /tracker-view-timer -->
        </main><!-- /tracker-main-area -->
      </div><!-- /tracker-app-shell -->
    </div><!-- /tracker-container -->

    <!-- Functional Task Editing Modal -->
    <div class="modal-backdrop" id="app-edit-task-modal" role="dialog" aria-modal="true" hidden>
      <div class="modal-card" style="max-width: 480px;">
        <div class="modal-header">
          <h3 class="modal-title font-serif" style="font-size: 22px;">Edit Task: <span id="edit-task-id-badge" style="color: #e07a5f;">TRK-104</span></h3>
          <button class="modal-close-btn" data-close="app-edit-task-modal" type="button" aria-label="Close dialog">&times;</button>
        </div>
        <form id="app-edit-task-form" style="padding: 20px 24px;">
          <input type="hidden" id="edit-task-id">
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px;">Task Title</label>
            <input type="text" id="edit-task-title" required class="auth-text-input" style="width: 100%; height: 42px; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; padding: 0 14px; font-size: 14px;">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px;">Squad</label>
              <select id="edit-task-squad" style="width: 100%; height: 40px; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; padding: 0 10px; font-size: 13.5px; background: #fff;">
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="UI/UX">UI/UX</option>
                <option value="DevOps">DevOps</option>
                <option value="Product">Product</option>
                <option value="Testing">Testing</option>
                <option value="Documentation">Documentation</option>
              </select>
            </div>
            <div>
              <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px;">Estimate (Story Pts)</label>
              <select id="edit-task-points" style="width: 100%; height: 40px; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; padding: 0 10px; font-size: 13.5px; background: #fff;">
                <option value="1">1 pt (Trivial)</option>
                <option value="2">2 pts (Small)</option>
                <option value="3">3 pts (Medium)</option>
                <option value="5">5 pts (Large)</option>
                <option value="8">8 pts (Complex)</option>
              </select>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 22px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px;">Status</label>
              <select id="edit-task-status" style="width: 100%; height: 40px; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; padding: 0 10px; font-size: 13.5px; background: #fff;">
                <option value="todo">Backlog</option>
                <option value="inprogress">In Progress</option>
                <option value="review">In Review</option>
                <option value="done">Done &amp; Merged</option>
              </select>
            </div>
            <div>
              <label style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px;">Calendar Day</label>
              <select id="edit-task-day" style="width: 100%; height: 40px; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; padding: 0 10px; font-size: 13.5px; background: #fff;">
                <option value="Mon">Monday</option>
                <option value="Tue">Tuesday</option>
                <option value="Wed">Wednesday</option>
                <option value="Thu">Thursday</option>
                <option value="Fri">Friday</option>
                <option value="Sat">Saturday</option>
                <option value="Sun">Sunday</option>
              </select>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <button class="pill-btn-danger-sm" id="edit-task-delete-btn" type="button" style="color: #dc2626; background: #fee2e2; border-radius: 8px; padding: 8px 14px; font-weight: 500; font-size: 13px; border: none; cursor: pointer;">Delete Task</button>
            <div style="display: flex; gap: 10px;">
              <button class="pill-btn-ghost-sm" data-close="app-edit-task-modal" type="button">Cancel</button>
              <button class="pill-btn-primary" type="submit" style="height: 38px;">Save Changes</button>
            </div>
          </div>
        </form>
      </div>
    </div>\n\n    `;
    content = content.substring(0, secClose + 10) + replacementCloses + content.substring(timerClosePos);
  }
}

fs.writeFileSync(indexPath, content, 'utf8');
console.log('Successfully updated index.html with Tracker app layout!');
