const fs = require('fs');

const appCss = `
/* ============================================================================
   ACTUAL APP DASHBOARD & DUMMY AUTH SYSTEM
   Steep / Linear-inspired focus workspace for Sprint 34
   ============================================================================ */

/* Navbar User Pill & Demo Buttons */
.nav-demo-btn {
  font-size: 13px !important;
  font-weight: 600 !important;
  height: 34px !important;
  padding: 0 14px !important;
  color: var(--color-ink-black, #17191c) !important;
  border-color: rgba(245, 155, 107, 0.45) !important;
  background: rgba(251, 225, 209, 0.25) !important;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.nav-demo-btn:hover {
  background: rgba(251, 225, 209, 0.5) !important;
  border-color: #f59b6b !important;
}

.nav-user-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 4px 8px;
  background: rgba(23, 25, 28, 0.04);
  border: 1px solid rgba(23, 25, 28, 0.08);
  border-radius: 9999px;
  font-size: 13px;
}

.user-avatar-badge {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #17191c;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name-tag {
  font-weight: 500;
  color: var(--color-ink-black, #17191c);
  margin-right: 4px;
}

.user-dash-btn {
  height: 28px !important;
  font-size: 12px !important;
  padding: 0 12px !important;
  cursor: pointer;
}

.nav-signout-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  line-height: 1;
  color: var(--color-slate-gray, #777b86);
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 50%;
  transition: color 0.15s, background 0.15s;
}
.nav-signout-btn:hover {
  color: #d64040;
  background: rgba(214, 64, 64, 0.1);
}

/* Modal Demo CTA Box */
.auth-demo-cta-box {
  margin: 0 0 16px 0;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(251, 225, 209, 0.45) 0%, rgba(245, 155, 107, 0.15) 100%);
  border: 1px solid rgba(245, 155, 107, 0.35);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auth-demo-signin-btn {
  width: 100%;
  height: 42px;
  background: var(--color-ink-black, #17191c);
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  font-size: 13.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.18s, transform 0.12s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
.auth-demo-signin-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.demo-role-badge {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 7px;
  border-radius: 9999px;
}

.auth-demo-hint {
  font-size: 11.5px;
  color: var(--color-slate-gray, #777b86);
  text-align: center;
}

/* In-App Mode Toggle Rules */
body.in-app-mode {
  overflow-x: hidden;
  background: #f7f7f9;
}

body.in-app-mode > header,
body.in-app-mode > main,
body.in-app-mode > footer,
body.in-app-mode > .mobile-sticky-cta,
body.in-app-mode > #hero-scroll-container {
  display: none !important;
}

body.in-app-mode #actual-app-view {
  display: block !important;
}

/* Actual App Shell */
.actual-app-view {
  min-height: 100vh;
  width: 100%;
  background: #f8f8fa;
  color: var(--color-ink-black, #17191c);
  font-family: var(--font-sohne, 'Inter', sans-serif);
}

.actual-app-shell {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* App Sidebar */
.actual-app-sidebar {
  width: 250px;
  background: #ffffff;
  border-right: 1px solid rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  padding: 16px 14px;
  position: sticky;
  top: 0;
  height: 100vh;
  flex-shrink: 0;
  z-index: 50;
}

.app-sidebar-header {
  margin-bottom: 20px;
}

.app-workspace-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.02);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.app-workspace-selector:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.12);
}

.workspace-avatar {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: var(--color-ink-black, #17191c);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.workspace-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.workspace-title {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.workspace-plan {
  font-size: 11px;
  color: var(--color-slate-gray, #777b86);
}

.workspace-arrow {
  color: var(--color-slate-gray, #777b86);
}

.app-sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
}

.app-nav-category {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-slate-gray, #777b86);
  padding: 8px 10px 4px;
}

.app-nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-slate-gray, #777b86);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
}

.app-nav-link:hover {
  color: var(--color-ink-black, #17191c);
  background: rgba(0, 0, 0, 0.04);
}

.app-nav-link.active {
  color: var(--color-ink-black, #17191c);
  background: rgba(0, 0, 0, 0.06);
  font-weight: 600;
}

.app-nav-badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.06);
  padding: 1px 7px;
  border-radius: 9999px;
}

.app-squad-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  font-size: 13px;
  color: var(--color-slate-gray, #777b86);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
}

.app-squad-filter:hover {
  color: var(--color-ink-black, #17191c);
  background: rgba(0, 0, 0, 0.03);
}

.app-squad-filter.active {
  color: var(--color-ink-black, #17191c);
  background: rgba(251, 225, 209, 0.35);
  font-weight: 600;
}

.squad-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-all { background: #888; }
.dot-platform { background: #17191c; }
.dot-frontend { background: #5d2a1a; }
.dot-security { background: #2563eb; }
.dot-devops { background: #10b981; }

.app-sidebar-footer {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.app-user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 4px;
}

.user-avatar-lg {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #17191c;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-card-info {
  display: flex;
  flex-direction: column;
}

.user-card-name {
  font-size: 13px;
  font-weight: 600;
}

.user-card-role {
  font-size: 11px;
  color: var(--color-slate-gray, #777b86);
}

.app-sidebar-actions {
  display: flex;
  gap: 8px;
}

.app-sidebar-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 32px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-slate-gray, #777b86);
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.app-sidebar-action-btn:hover {
  color: var(--color-ink-black, #17191c);
  background: rgba(0, 0, 0, 0.06);
}

.app-sidebar-action-btn.signout:hover {
  color: #d64040;
  background: rgba(214, 64, 64, 0.08);
  border-color: rgba(214, 64, 64, 0.2);
}

/* Actual App Main Viewport */
.actual-app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 0 28px 60px 28px;
}

/* Actual App Topbar */
.actual-app-topbar {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 22px;
  gap: 20px;
}

.app-breadcrumbs {
  font-size: 13.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.crumb-dim {
  color: var(--color-slate-gray, #777b86);
}

.crumb-sep {
  color: rgba(0, 0, 0, 0.2);
}

.crumb-active {
  font-weight: 600;
  color: var(--color-ink-black, #17191c);
}

.app-search-input-wrap {
  position: relative;
  width: 320px;
  display: flex;
  align-items: center;
}

.app-search-input-wrap svg {
  position: absolute;
  left: 12px;
  color: var(--color-slate-gray, #777b86);
  pointer-events: none;
}

.app-search-input {
  width: 100%;
  height: 36px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 0 32px 0 34px;
  font-size: 13px;
  font-family: inherit;
  color: var(--color-ink-black, #17191c);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.app-search-input:focus {
  border-color: var(--color-ink-black, #17191c);
  box-shadow: 0 0 0 2px rgba(23, 25, 28, 0.08);
}

.search-key-hint {
  position: absolute;
  right: 10px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.06);
  color: var(--color-slate-gray, #777b86);
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
}

.app-topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* KPI Metrics Row */
.app-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.app-stat-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
}

.stat-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-title {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-slate-gray, #777b86);
}

.stat-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
}
.stat-badge.green { background: #eef7ee; color: #2b7a2b; }
.stat-badge.blue { background: #eef4fe; color: #1e58b8; }
.stat-badge.amber { background: #fdf6ec; color: #b45309; }
.stat-badge.gray { background: #f1f2f4; color: #5f6368; }

.stat-main-number {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: var(--color-ink-black, #17191c);
  margin-bottom: 6px;
}

.stat-unit {
  font-size: 14px;
  font-weight: 450;
  color: var(--color-slate-gray, #777b86);
}

.stat-progress-track {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.stat-progress-bar {
  height: 100%;
  background: #10b981;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.stat-caption {
  font-size: 12px;
  color: var(--color-slate-gray, #777b86);
}

/* App Tab Panels */
.app-tab-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Board Toolbar */
.app-board-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.board-toolbar-squads {
  display: flex;
  align-items: center;
  gap: 6px;
}

.squads-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-slate-gray, #777b86);
  margin-right: 4px;
}

.squad-chip {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-slate-gray, #777b86);
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.squad-chip:hover {
  border-color: var(--color-ink-black, #17191c);
  color: var(--color-ink-black, #17191c);
}
.squad-chip.active {
  background: var(--color-ink-black, #17191c);
  color: #ffffff;
  border-color: var(--color-ink-black, #17191c);
}

.board-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.board-hint-text {
  font-size: 12px;
  color: var(--color-slate-gray, #777b86);
}

/* 4-Column Actual Kanban Board */
.actual-kanban-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: flex-start;
}

.app-board-col {
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 520px;
}

.col-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 12px 6px;
}

.col-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.col-status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot-todo { background: #888; }
.dot-inprogress { background: #f59b6b; box-shadow: 0 0 0 2px rgba(245, 155, 107, 0.25); }
.dot-review { background: #3b82f6; }
.dot-done { background: #10b981; }

.col-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-ink-black, #17191c);
}

.col-count-bubble {
  font-size: 11.5px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 7px;
  border-radius: 9999px;
  color: var(--color-slate-gray, #777b86);
}

.app-cards-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 420px;
}

/* App Task Card */
.app-task-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 10px;
  padding: 12px 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  cursor: grab;
  user-select: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.app-task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.14);
}

.app-task-card.dragging {
  opacity: 0.4;
  cursor: grabbing;
}

.app-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-card-id {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-slate-gray, #777b86);
}

.app-card-pts {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.04);
  color: var(--color-ink-black, #17191c);
}

.app-card-title {
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--color-ink-black, #17191c);
}

.app-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.app-squad-tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
}
.app-squad-tag.Platform { background: rgba(23, 25, 28, 0.07); color: #17191c; }
.app-squad-tag.Frontend { background: rgba(93, 42, 26, 0.08); color: #5d2a1a; }
.app-squad-tag.Security { background: rgba(37, 99, 235, 0.08); color: #2563eb; }
.app-squad-tag.DevOps { background: rgba(16, 185, 129, 0.08); color: #059669; }

.app-card-right-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.app-assignee-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #374151;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-card-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.app-task-card:hover .app-card-actions {
  opacity: 1;
}

.app-card-action-btn {
  background: transparent;
  border: none;
  font-size: 12px;
  color: var(--color-slate-gray, #777b86);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}
.app-card-action-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: var(--color-ink-black, #17191c);
}
.app-card-action-btn.delete:hover {
  background: rgba(214, 64, 64, 0.1);
  color: #d64040;
}

/* List Table View */
.app-table-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.app-issues-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
  text-align: left;
}

.app-issues-table th {
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-slate-gray, #777b86);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.app-issues-table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  color: var(--color-ink-black, #17191c);
}

.app-issues-table tr:hover td {
  background: rgba(0, 0, 0, 0.015);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 9999px;
}
.status-badge.todo { background: #f1f2f4; color: #5f6368; }
.status-badge.inprogress { background: #fef3c7; color: #b45309; }
.status-badge.review { background: #e0f2fe; color: #0369a1; }
.status-badge.done { background: #dcfce7; color: #15803d; }

/* Analytics Tab Grid */
.app-analytics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.analytics-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.analytics-card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.analytics-chart-mockup {
  width: 100%;
  height: 190px;
}

.burnup-svg {
  width: 100%;
  height: 100%;
}

.analytics-footer-summary {
  font-size: 12.5px;
  color: var(--color-slate-gray, #777b86);
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.squad-points-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.squad-bar-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.squad-bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.squad-bar-track {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  overflow: hidden;
}

.squad-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

/* ============================================================================
   DARK MODE ADAPTATIONS FOR ACTUAL APP
   ============================================================================ */

html.dark body.in-app-mode {
  background: #0f1012;
}

html.dark .actual-app-view {
  background: #0f1012;
  color: #fbe1d1;
}

html.dark .actual-app-sidebar {
  background: #151619;
  border-right-color: rgba(255, 255, 255, 0.07);
}

html.dark .app-workspace-selector {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}
html.dark .app-workspace-selector:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

html.dark .workspace-avatar {
  background: #fbe1d1;
  color: #17191c;
}

html.dark .workspace-title {
  color: #fbe1d1;
}

html.dark .app-nav-link {
  color: rgba(251, 225, 209, 0.6);
}
html.dark .app-nav-link:hover {
  color: #fbe1d1;
  background: rgba(255, 255, 255, 0.05);
}
html.dark .app-nav-link.active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}
html.dark .app-nav-badge {
  background: rgba(255, 255, 255, 0.1);
  color: #fbe1d1;
}

html.dark .app-squad-filter {
  color: rgba(251, 225, 209, 0.55);
}
html.dark .app-squad-filter:hover {
  color: #fbe1d1;
  background: rgba(255, 255, 255, 0.04);
}
html.dark .app-squad-filter.active {
  color: #f59b6b;
  background: rgba(245, 155, 107, 0.12);
}

html.dark .user-avatar-lg {
  background: #fbe1d1;
  color: #17191c;
}
html.dark .user-card-name {
  color: #fbe1d1;
}

html.dark .app-sidebar-footer {
  border-top-color: rgba(255, 255, 255, 0.07);
}

html.dark .app-sidebar-action-btn {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: rgba(251, 225, 209, 0.6);
}
html.dark .app-sidebar-action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fbe1d1;
}

html.dark .actual-app-topbar {
  border-bottom-color: rgba(255, 255, 255, 0.07);
}
html.dark .crumb-active {
  color: #fbe1d1;
}

html.dark .app-search-input {
  background: #17181c;
  border-color: rgba(255, 255, 255, 0.12);
  color: #fbe1d1;
}
html.dark .app-search-input:focus {
  border-color: #f59b6b;
  box-shadow: 0 0 0 2px rgba(245, 155, 107, 0.18);
}
html.dark .search-key-hint {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(251, 225, 209, 0.5);
}

html.dark .app-stat-card {
  background: #151619;
  border-color: rgba(255, 255, 255, 0.07);
}
html.dark .stat-main-number {
  color: #fbe1d1;
}
html.dark .stat-progress-track {
  background: rgba(255, 255, 255, 0.08);
}

html.dark .squad-chip {
  background: #17181c;
  border-color: rgba(255, 255, 255, 0.12);
  color: rgba(251, 225, 209, 0.6);
}
html.dark .squad-chip:hover {
  border-color: #f59b6b;
  color: #fbe1d1;
}
html.dark .squad-chip.active {
  background: #f59b6b;
  border-color: #f59b6b;
  color: #17191c;
}

html.dark .app-board-col {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.06);
}
html.dark .col-name {
  color: #fbe1d1;
}
html.dark .col-count-bubble {
  background: rgba(255, 255, 255, 0.08);
  color: #fbe1d1;
}

html.dark .app-task-card {
  background: #18191d;
  border-color: rgba(255, 255, 255, 0.08);
}
html.dark .app-task-card:hover {
  border-color: rgba(245, 155, 107, 0.4);
}
html.dark .app-card-title {
  color: #fbe1d1;
}
html.dark .app-card-pts {
  background: rgba(255, 255, 255, 0.08);
  color: #fbe1d1;
}
html.dark .app-card-action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fbe1d1;
}

html.dark .app-table-card,
html.dark .analytics-card {
  background: #151619;
  border-color: rgba(255, 255, 255, 0.07);
}
html.dark .app-issues-table th {
  background: rgba(255, 255, 255, 0.03);
  border-bottom-color: rgba(255, 255, 255, 0.06);
}
html.dark .app-issues-table td {
  border-bottom-color: rgba(255, 255, 255, 0.05);
  color: #fbe1d1;
}

html.dark .nav-user-pill {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}
html.dark .user-name-tag {
  color: #fbe1d1;
}
html.dark .user-avatar-badge {
  background: #fbe1d1;
  color: #17191c;
}
html.dark .nav-demo-btn {
  background: rgba(245, 155, 107, 0.12) !important;
  color: #f59b6b !important;
  border-color: rgba(245, 155, 107, 0.3) !important;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .actual-kanban-board {
    grid-template-columns: repeat(2, 1fr);
  }
  .app-stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .actual-app-shell {
    flex-direction: column;
  }
  .actual-app-sidebar {
    width: 100%;
    height: auto;
    position: relative;
    border-right: none;
    border-bottom: 1px solid rgba(0,0,0,0.07);
  }
  .actual-kanban-board {
    grid-template-columns: 1fr;
  }
  .app-stats-row {
    grid-template-columns: 1fr;
  }
  .actual-app-topbar {
    flex-direction: column;
    height: auto;
    padding: 12px 0;
  }
  .app-search-input-wrap {
    width: 100%;
  }
}
`;

fs.appendFileSync('src/style.css', appCss, 'utf8');
console.log('App CSS successfully appended to src/style.css');
