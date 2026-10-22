const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

const trackerCss = `
/* ==========================================================================
   TRACKER DASHBOARD: REFERENCE-IDENTICAL DESIGN SYSTEM
   Warm cream background, peach accents, elegant serif headings, rounded cards
   ========================================================================== */

.actual-app-view {
  min-height: 100vh;
  width: 100%;
  background-color: #faf8f5 !important;
  color: #18181b;
  font-family: var(--font-sohne, 'Inter', -apple-system, sans-serif);
  padding: 0 0 60px 0;
}

.tracker-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
}

/* --- Top Global Bar --- */
.tracker-top-bar {
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
}

.tracker-brand-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tracker-logo-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffb69b, #e07a5f 70%, #c45b40 100%);
  box-shadow: 0 2px 8px rgba(224, 122, 95, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tracker-logo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
}

.tracker-brand-title {
  font-size: 19px;
  font-weight: 700;
  color: #18181b;
  letter-spacing: -0.4px;
}

.tracker-pill-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
}

.tracker-pill-tab {
  background: transparent;
  border: none;
  padding: 7px 18px;
  border-radius: 9999px;
  font-size: 13.5px;
  font-weight: 500;
  color: #52525b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tracker-pill-tab:hover {
  color: #18181b;
  background: rgba(0, 0, 0, 0.04);
}

.tracker-pill-tab.active {
  background: #fae9e2 !important;
  color: #18181b !important;
  font-weight: 600;
}

.tracker-top-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tracker-circle-action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #52525b;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.tracker-circle-action-btn:hover {
  background: #f4f0eb;
  color: #18181b;
}

.tracker-notif-badge {
  position: absolute;
  top: 7px;
  right: 8px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ef4444;
  border: 1.5px solid #ffffff;
}

.tracker-user-profile-wrap {
  position: relative;
}

.tracker-user-pill-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px 4px 4px;
  border-radius: 9999px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tracker-user-pill-btn:hover {
  background: #f9f6f2;
}

.tracker-user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #ffdfd4;
  color: #ba5d40;
  font-weight: 600;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tracker-user-meta {
  display: flex;
  flex-direction: column;
  text-align: left;
  line-height: 1.2;
}

.tracker-user-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #18181b;
}

.tracker-user-email {
  font-size: 10.5px;
  color: #a1a1aa;
}

.tracker-chevron-icon {
  color: #71717a;
}

/* --- App Shell (Sidebar + Main) --- */
.tracker-app-shell {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

/* --- Left Sidebar --- */
.tracker-sidebar {
  width: 90px;
  flex-shrink: 0;
  position: sticky;
  top: 16px;
}

.tracker-sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tracker-sidebar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 6px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: #71717a;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tracker-sidebar-item:hover {
  color: #18181b;
  background: rgba(0, 0, 0, 0.03);
}

.tracker-sidebar-item.active {
  background: #fae9e2 !important;
  color: #ba5d40 !important;
  font-weight: 600;
}

/* --- Main Area --- */
.tracker-main-area {
  flex: 1;
  min-width: 0;
}

.tracker-view {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.tracker-view[hidden] {
  display: none !important;
}

/* --- View Header --- */
.tracker-view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.tracker-page-title {
  font-family: var(--font-signifier), 'Instrument Serif', Georgia, serif;
  font-size: 36px;
  font-weight: 500;
  color: #18181b;
  margin: 0;
  line-height: 1.15;
  letter-spacing: -0.5px;
}

.tracker-page-subtitle {
  font-size: 14px;
  color: #71717a;
  margin-top: 4px;
}

.header-right-tools {
  display: flex;
  align-items: center;
  gap: 14px;
}

.tracker-clock-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 6px 14px;
  border-radius: 9999px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}

.clock-pill-date {
  font-size: 11px;
  font-weight: 600;
  color: #e07a5f;
  letter-spacing: 0.5px;
}

.clock-pill-time {
  font-size: 13.5px;
  font-weight: 600;
  font-family: monospace;
  color: #18181b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.clock-pill-time .ampm {
  font-size: 10.5px;
  color: #71717a;
}

.clock-pill-greeting {
  font-size: 12.5px;
  color: #52525b;
}

.tracker-new-issue-btn {
  background: #18181b;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tracker-new-issue-btn:hover {
  background: #27272a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* --- Cards Common --- */
.tracker-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 4px 14px rgba(0, 0, 0, 0.025);
  padding: 22px 24px;
  transition: box-shadow 0.2s ease;
}

.tracker-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03), 0 8px 20px rgba(0, 0, 0, 0.035);
}

.card-top-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-heading {
  font-size: 16px;
  font-weight: 600;
  color: #18181b;
  margin: 0;
}

.card-sub-info {
  font-size: 12.5px;
  color: #71717a;
}

/* --- Row 1: Glance & Health Grid --- */
.tracker-glance-health-row {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: 20px;
}

.glance-card-content {
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 20px;
  align-items: center;
}

.glance-metrics-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.metric-item .metric-number {
  font-size: 28px;
  font-weight: 700;
  color: #18181b;
  line-height: 1.1;
}

.metric-item .pts-unit {
  font-size: 14px;
  font-weight: 500;
  color: #71717a;
}

.metric-item .metric-label {
  font-size: 12.5px;
  color: #71717a;
  margin-top: 4px;
}

.metric-trend-tag {
  font-size: 12px;
  font-weight: 500;
  color: #10b981;
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.sprint-countdown-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.sprint-countdown-badge .countdown-text {
  font-size: 12px;
  font-weight: 500;
  color: #71717a;
}

.mini-bar-track {
  width: 76px;
  height: 5px;
  background: #f0ece6;
  border-radius: 999px;
  overflow: hidden;
}

.mini-bar-fill {
  height: 100%;
  background: #e07a5f;
  border-radius: 999px;
}

/* Stacked bar chart */
.glance-chart-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart-legend-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  font-size: 11.5px;
  color: #71717a;
}

.legend-chip {
  display: flex;
  align-items: center;
  gap: 5px;
}

.chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.chip-dot.dot-completed { background: #e07a5f; }
.chip-dot.dot-planned { background: #e8e4de; }

.stacked-bars-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 76px;
  padding-top: 6px;
}

.bar-day-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stacked-bar {
  width: 14px;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
}

.bar-segment.completed {
  width: 100%;
  background: #e07a5f;
  border-radius: 3px 3px 0 0;
  transition: height 0.3s ease;
}

.bar-segment.planned {
  width: 100%;
  background: #e8e4de;
  border-radius: 3px 3px 0 0;
  margin-bottom: 2px;
  transition: height 0.3s ease;
}

.day-label {
  font-size: 11px;
  color: #a1a1aa;
}

/* --- Sprint Health Card --- */
.health-status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.health-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.health-badge-text strong {
  font-size: 13px;
  color: #10b981;
  margin-right: 6px;
}

.health-badge-text span {
  font-size: 12px;
  color: #71717a;
}

.health-card-body {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 20px;
  align-items: center;
}

.health-donut-wrap {
  width: 90px;
  height: 90px;
  position: relative;
}

.health-donut-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.health-donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
}

.health-pct-text {
  font-size: 20px;
  font-weight: 700;
  color: #18181b;
}

.health-pct-sub {
  font-size: 10.5px;
  color: #71717a;
}

.health-breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.health-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: #52525b;
}

.health-item strong {
  color: #18181b;
}

.health-item .label {
  color: #71717a;
}

/* --- Row 2: Timer, Backlog, Quick Notes Grid --- */
.tracker-widgets-row {
  display: grid;
  grid-template-columns: 1fr 0.9fr 1.3fr;
  gap: 20px;
}

.timer-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timer-mode-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fae9e2;
  color: #e07a5f;
}

.timer-expand-btn {
  background: none;
  border: none;
  color: #a1a1aa;
  cursor: pointer;
  padding: 4px;
}
.timer-expand-btn:hover { color: #18181b; }

.timer-summary-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.timer-countdown-digits {
  font-size: 32px;
  font-weight: 500;
  color: #18181b;
  line-height: 1;
}

.timer-sub-motto {
  font-size: 12px;
  color: #71717a;
  margin-top: 4px;
}

.timer-summary-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.timer-mini-ring-wrap {
  width: 44px;
  height: 44px;
  position: relative;
}

.timer-mini-progress-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.timer-play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e07a5f;
  color: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(224, 122, 95, 0.4);
  transition: transform 0.15s ease;
}

.timer-play-btn:hover {
  transform: translate(-50%, -50%) scale(1.06);
}

.timer-reset-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #faf8f5;
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: #52525b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.timer-reset-btn:hover {
  background: #f0ece6;
  color: #18181b;
}

.backlog-number-display {
  font-size: 34px;
  font-weight: 700;
  color: #18181b;
  line-height: 1.1;
}

.backlog-sub-text {
  font-size: 12.5px;
  color: #71717a;
  margin-top: 4px;
}

.quicknotes-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* --- Filter Pills & Search Bar --- */
.tracker-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-pills-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-pill {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  color: #52525b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill:hover {
  background: #f7f4ef;
  color: #18181b;
}

.filter-pill.active {
  background: #18181b !important;
  color: #ffffff !important;
  border-color: #18181b !important;
}

.filter-search-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-wrap svg {
  position: absolute;
  left: 12px;
  color: #a1a1aa;
}

.tracker-search-input {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 9999px;
  padding: 7px 16px 7px 34px;
  font-size: 13px;
  width: 220px;
  color: #18181b;
  transition: all 0.15s ease;
}

.tracker-search-input:focus {
  outline: none;
  border-color: #e07a5f;
  box-shadow: 0 0 0 3px rgba(224, 122, 95, 0.15);
  width: 260px;
}

.filter-action-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
  color: #52525b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.filter-action-icon-btn:hover {
  background: #f4f0eb;
  color: #18181b;
}

/* --- Four-Column Kanban Board --- */
.tracker-kanban-board-wrap {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 12px;
}

.clockit-kanban-columns {
  display: grid;
  grid-template-columns: repeat(4, minmax(260px, 1fr));
  gap: 18px;
}

.app-board-col {
  background: rgba(0, 0, 0, 0.015);
  border-radius: 14px;
  padding: 12px;
  min-height: 480px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: background 0.15s ease;
}

.app-board-col.drag-over {
  background: #fae9e2;
  outline: 2px dashed #e07a5f;
}

.clockit-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
}

.col-indicator-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.status-dot.dot-todo { background: #8892b0; }
.status-dot.dot-inprogress { background: #3b82f6; }
.status-dot.dot-review { background: #f59e0b; }
.status-dot.dot-done { background: #10b981; }

.col-title-text {
  font-size: 14px;
  font-weight: 600;
  color: #18181b;
}

.col-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.col-count-bubble {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  background: #edeae4;
  color: #52525b;
}

.col-more-btn {
  background: none;
  border: none;
  color: #a1a1aa;
  cursor: pointer;
  padding: 2px 4px;
}
.col-more-btn:hover { color: #18181b; }

.app-cards-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

/* Kanban Cards (Matching Reference Image) */
.app-task-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  cursor: grab;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
}

.app-task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.app-task-card.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.app-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-card-check-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-card-checkbox {
  width: 15px;
  height: 15px;
  border-radius: 4px;
  cursor: pointer;
  accent-color: #10b981;
}

.app-card-id {
  font-size: 11.5px;
  font-weight: 500;
  color: #71717a;
}

.app-card-more-btn {
  background: none;
  border: none;
  color: #a1a1aa;
  cursor: pointer;
  padding: 2px 4px;
}
.app-card-more-btn:hover { color: #18181b; }

.app-card-title {
  font-size: 13.5px;
  font-weight: 500;
  color: #18181b;
  margin: 8px 0 12px 0;
  line-height: 1.35;
}

.app-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-squad-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
}

.squad-frontend { background: #ede9fe; color: #6d28d9; }
.squad-backend { background: #dcfce7; color: #15803d; }
.squad-uiux { background: #fce7f3; color: #be185d; }
.squad-devops { background: #f3e8ff; color: #7e22ce; }
.squad-product { background: #ffedd5; color: #c2410c; }
.squad-testing { background: #fef3c7; color: #b45309; }
.squad-documentation { background: #e0f2fe; color: #0369a1; }
.squad-platform { background: #e0e7ff; color: #3730a3; }
.squad-security { background: #ffe4e6; color: #be123c; }

.app-card-pts {
  font-size: 11.5px;
  color: #71717a;
  font-weight: 500;
}

.app-assignee-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-ac { background: #ffdfd4; color: #ba5d40; }
.avatar-rk { background: #d1fae5; color: #047857; }
.avatar-jd { background: #e0e7ff; color: #4338ca; }
.avatar-sm { background: #e0f2fe; color: #0284c7; }
.avatar-np { background: #fef3c7; color: #b45309; }
.avatar-jb { background: #fae8ff; color: #86198f; }
.avatar-mv { background: #fee2e2; color: #991b1b; }
.avatar-er { background: #ccfbf1; color: #115e59; }

/* --- Calendar View --- */
.tracker-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 14px;
}

.cal-day-col {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 480px;
}

.cal-day-col.is-today {
  border-color: #e07a5f;
  background: #fffdfb;
}

.cal-day-header {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 8px;
}

.cal-day-name {
  font-size: 13px;
  font-weight: 600;
  color: #18181b;
}

.cal-day-date {
  font-size: 11.5px;
  color: #71717a;
  display: flex;
  align-items: center;
  gap: 6px;
}

.today-chip {
  background: #e07a5f;
  color: #ffffff;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 9.5px;
  font-weight: 600;
}

.cal-tasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.cal-task-card {
  background: #faf8f5;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.cal-task-card:hover {
  transform: translateY(-1px);
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}

.cal-task-card.is-done {
  opacity: 0.6;
  text-decoration: line-through;
}

.cal-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.cal-check {
  width: 13px;
  height: 13px;
  cursor: pointer;
}

.cal-id {
  font-size: 10.5px;
  font-weight: 600;
  color: #71717a;
}

.cal-pts {
  font-size: 10.5px;
  color: #a1a1aa;
}

.cal-title {
  font-size: 12px;
  font-weight: 500;
  color: #18181b;
  margin-bottom: 6px;
  line-height: 1.25;
}

.cal-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cal-assignee {
  font-size: 10px;
  font-weight: 600;
  color: #71717a;
}

.cal-add-deadline-btn {
  background: transparent;
  border: 1px dashed rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 6px;
  font-size: 11.5px;
  color: #71717a;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cal-add-deadline-btn:hover {
  background: #fdf5f2;
  border-color: #e07a5f;
  color: #e07a5f;
}

.cal-empty-day {
  font-size: 11.5px;
  color: #a1a1aa;
  text-align: center;
  margin-top: 40px;
}

/* --- Notes & Obsidian Knowledge Graph View --- */
.tracker-notes-container {
  display: grid;
  grid-template-columns: 260px 1.4fr 1fr;
  gap: 18px;
  min-height: 600px;
}

.notes-list-col {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notes-search-input {
  width: 100%;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 12.5px;
}

.notes-tags-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.notes-tag-chip {
  background: #faf8f5;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: #71717a;
  cursor: pointer;
}

.notes-tag-chip.active {
  background: #fae9e2;
  color: #e07a5f;
  font-weight: 600;
  border-color: #e07a5f;
}

.notes-cards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 520px;
}

.note-list-card {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.15s ease;
}

.note-list-card:hover {
  background: #faf8f5;
}

.note-list-card.active {
  background: #fdf6f2;
  border-color: #e07a5f;
}

.note-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.note-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #18181b;
  margin: 0;
}

.note-card-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f0ece6;
  color: #71717a;
}

.note-card-snippet {
  font-size: 11.5px;
  color: #71717a;
  margin: 0 0 6px 0;
  line-height: 1.3;
}

.note-card-date {
  font-size: 10px;
  color: #a1a1aa;
}

/* Notes Editor */
.notes-editor-col {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.editor-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.note-title-input {
  font-size: 24px;
  font-weight: 600;
  border: none;
  background: transparent;
  color: #18181b;
  width: 100%;
}
.note-title-input:focus { outline: none; border-bottom: 1px solid #e07a5f; }

.note-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.note-category-select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 12px;
}

.note-save-status {
  font-size: 11px;
  color: #10b981;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  background: #faf8f5;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.editor-tool-btn {
  background: transparent;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #52525b;
  cursor: pointer;
}
.editor-tool-btn:hover { background: #ede8e0; color: #18181b; }

.editor-tool-divider {
  width: 1px;
  height: 16px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 4px;
}

.editor-split-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  flex: 1;
}

.note-raw-textarea {
  width: 100%;
  height: 380px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 12px;
  font-family: monospace;
  font-size: 12.5px;
  line-height: 1.5;
  resize: vertical;
}

.note-preview-pane {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 14px 16px;
  background: #fdfbf8;
  overflow-y: auto;
  height: 380px;
}

.note-rendered-h1 { font-size: 20px; margin: 0 0 10px 0; color: #18181b; }
.note-rendered-h2 { font-size: 17px; margin: 12px 0 8px 0; color: #18181b; }
.note-rendered-h3 { font-size: 15px; margin: 10px 0 6px 0; color: #18181b; }
.note-rendered-p { font-size: 13px; line-height: 1.5; color: #27272a; margin-bottom: 8px; }
.note-rendered-spacer { height: 8px; }

.note-checklist-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  font-size: 13px;
  color: #18181b;
}

.note-checklist-item.checked .note-chkbox-label {
  text-decoration: line-through;
  color: #a1a1aa;
}

.note-internal-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: #fae9e2;
  color: #ba5d40;
  border: 1px solid rgba(224, 122, 95, 0.25);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.note-internal-link:hover {
  background: #f5d6ca;
}

.note-table-wrap {
  margin: 10px 0;
  overflow-x: auto;
}

.note-rendered-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.note-rendered-table th,
.note-rendered-table td {
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 6px 10px;
  text-align: left;
}

.note-rendered-table th {
  background: #f4eee7;
  font-weight: 600;
  color: #18181b;
}

/* Obsidian Knowledge Graph Column */
.notes-graph-col {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.graph-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.graph-title-group {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #18181b;
}

.graph-reset-btn {
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  color: #71717a;
  cursor: pointer;
}

.graph-svg-wrapper {
  flex: 1;
  min-height: 380px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  background: #fbf9f6;
  position: relative;
}

.knowledge-graph-svg {
  width: 100%;
  height: 100%;
}

/* Obsidian Straight Connecting Lines */
.graph-straight-edge {
  stroke: rgba(224, 122, 95, 0.35);
  stroke-width: 1.5;
  stroke-linecap: round;
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}

.graph-straight-edge.edge-active {
  stroke: #e07a5f;
  stroke-width: 2.2;
}

.graph-straight-edge.edge-highlight {
  stroke: #ba5d40 !important;
  stroke-width: 3 !important;
}

.graph-node-group {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.graph-circle-node {
  fill: #ffffff;
  stroke: #e07a5f;
  stroke-width: 2.2;
  transition: all 0.2s ease;
}

.graph-node-group.type-concept .graph-circle-node {
  stroke: #71717a;
}

.graph-node-group.is-active-node .graph-circle-node {
  fill: #e07a5f;
  stroke: #ba5d40;
  stroke-width: 3;
}

.node-glow-aura {
  fill: none;
  stroke: rgba(224, 122, 95, 0.2);
  stroke-width: 6;
  animation: auraPulse 2.5s infinite ease-in-out;
}

@keyframes auraPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.15); opacity: 0.9; }
}

.graph-node-label {
  font-size: 11px;
  font-weight: 500;
  fill: #18181b;
  pointer-events: none;
}

.graph-footer-hint {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
  font-size: 11px;
  color: #71717a;
}

.graph-legend-dots {
  display: flex;
  gap: 10px;
}

.chip-dot.dot-note { background: #e07a5f; }
.chip-dot.dot-link { background: #71717a; }

/* --- Reports Grid --- */
.tracker-reports-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.velocity-huge-number {
  font-size: 44px;
  font-weight: 700;
  color: #18181b;
  margin: 12px 0 4px 0;
}

.velocity-huge-number .unit {
  font-size: 16px;
  font-weight: 500;
  color: #71717a;
}

.velocity-sub {
  font-size: 13px;
  color: #71717a;
  margin-bottom: 14px;
}

.velocity-progress-bar {
  height: 8px;
  border-radius: 999px;
  background: #ede8e0;
  overflow: hidden;
}

.velocity-fill {
  height: 100%;
  border-radius: 999px;
  background: #10b981;
}

.squad-breakdown-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.squad-row {
  display: grid;
  grid-template-columns: 100px 60px 1fr;
  align-items: center;
  gap: 12px;
  font-size: 12.5px;
}

.squad-row .bar-fill {
  height: 6px;
  border-radius: 999px;
  background: #e07a5f;
}

/* --- Floating Music Widget ("Focus Mode - Lo-fi Beats") --- */
.music-widget-container {
  position: fixed;
  bottom: 24px;
  right: 28px;
  z-index: 990;
}

.music-pill-trigger {
  background: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  border-radius: 9999px !important;
  padding: 6px 14px 6px 6px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
}

.music-pulse-disc {
  width: 32px !important;
  height: 32px !important;
  border-radius: 50% !important;
  background: radial-gradient(circle at 35% 35%, #ffd2c1, #e07a5f 70%, #9e432b 100%) !important;
  box-shadow: 0 2px 6px rgba(224, 122, 95, 0.4) !important;
}

.music-pill-label {
  font-size: 12.5px !important;
  font-weight: 600 !important;
  color: #18181b !important;
}

.music-pill-status {
  font-size: 10.5px !important;
  color: #71717a !important;
}

/* --- Dark Mode Overrides for Tracker --- */
html.dark .actual-app-view {
  background-color: #121316 !important;
  color: #f3f4f6;
}

html.dark .tracker-top-bar {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

html.dark .tracker-brand-title,
html.dark .tracker-page-title,
html.dark .card-heading,
html.dark .metric-item .metric-number,
html.dark .health-pct-text,
html.dark .col-title-text,
html.dark .app-card-title,
html.dark .note-card-title,
html.dark .note-title-input,
html.dark .cal-day-name {
  color: #f3f4f6 !important;
}

html.dark .tracker-card,
html.dark .app-task-card,
html.dark .cal-day-col,
html.dark .notes-list-col,
html.dark .notes-editor-col,
html.dark .notes-graph-col,
html.dark .tracker-circle-action-btn,
html.dark .tracker-user-pill-btn,
html.dark .tracker-clock-pill,
html.dark .filter-pill,
html.dark .tracker-search-input,
html.dark .music-pill-trigger {
  background: #1c1d22 !important;
  border-color: rgba(255, 255, 255, 0.08) !important;
  color: #e4e4e7;
}

html.dark .app-board-col {
  background: rgba(255, 255, 255, 0.02);
}

html.dark .tracker-pill-tab.active,
html.dark .tracker-sidebar-item.active {
  background: rgba(224, 122, 95, 0.2) !important;
  color: #ff9d82 !important;
}

html.dark .graph-svg-wrapper,
html.dark .note-preview-pane {
  background: #15161a !important;
}

html.dark .graph-circle-node {
  fill: #1c1d22;
}

html.dark .graph-node-label {
  fill: #f3f4f6;
}

/* --- Responsive Adjustments --- */
@media (max-width: 1024px) {
  .tracker-app-shell {
    flex-direction: column;
  }
  .tracker-sidebar {
    width: 100%;
    position: static;
  }
  .tracker-sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
  }
  .tracker-glance-health-row {
    grid-template-columns: 1fr;
  }
  .tracker-widgets-row {
    grid-template-columns: 1fr;
  }
  .tracker-notes-container {
    grid-template-columns: 1fr;
  }
  .tracker-calendar-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
`;

css += trackerCss;
fs.writeFileSync(cssPath, css, 'utf8');
console.log('Successfully appended Tracker styles to src/style.css!');
