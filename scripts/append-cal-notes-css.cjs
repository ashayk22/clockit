const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'style.css');
let css = fs.readFileSync(cssPath, 'utf8');

const newStyles = `
/* ==========================================================================
   SUBSCRIPTION CALENDAR (watermelon.sh Specification)
   ========================================================================== */

.tracker-calendar-layout {
  display: grid;
  grid-template-columns: 460px 1fr;
  gap: 24px;
  align-items: start;
}

@media (max-width: 1080px) {
  .tracker-calendar-layout {
    grid-template-columns: 1fr;
  }
}

.sub-cal-badge-pill {
  font-size: 11px;
  font-weight: 600;
  background: #fae9e2;
  color: #ba6542;
  padding: 6px 14px;
  border-radius: 9999px;
  border: 1px solid rgba(186, 101, 66, 0.2);
}

/* Subscription Calendar Card */
.sub-cal-widget-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 26px;
  padding: 20px 22px;
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02);
  transition: all 0.4s ease;
  overflow: hidden;
}

html.dark .sub-cal-widget-card {
  background: #111113;
  border-color: #27272a;
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
}

.sub-cal-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sub-cal-meta-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sub-cal-month-heading {
  font-size: 14px;
  font-weight: 600;
  color: #18181b;
  margin: 0;
}

html.dark .sub-cal-month-heading {
  color: #f4f4f5;
}

.sub-cal-today-pill {
  font-size: 10px;
  font-weight: 500;
  color: #71717a;
  background: transparent;
  border: 1px solid #e4e4e7;
  padding: 2px 10px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
}

.sub-cal-today-pill:hover {
  background: #f4f4f5;
  color: #18181b;
}

html.dark .sub-cal-today-pill {
  border-color: #3f3f46;
  color: #a1a1aa;
}

html.dark .sub-cal-today-pill:hover {
  background: #27272a;
  color: #ffffff;
}

.sub-cal-arrow-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sub-cal-icon-nav {
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 4px;
  color: #a1a1aa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.sub-cal-icon-nav:hover {
  background: #f4f4f5;
  color: #18181b;
}

html.dark .sub-cal-icon-nav:hover {
  background: #27272a;
  color: #ffffff;
}

.sub-cal-plus-cta {
  width: 44px;
  height: 28px;
  border-radius: 9999px;
  background: #fa6a2e;
  color: #ffffff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px rgba(250, 106, 46, 0.35);
  transition: transform 0.2s, box-shadow 0.2s;
}

.sub-cal-plus-cta:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(250, 106, 46, 0.5);
}

.sub-cal-plus-cta:active {
  transform: scale(0.96);
}

/* Modal Overlays inside Card */
.sub-cal-viewport-container {
  position: relative;
}

.sub-cal-modal-overlay {
  position: absolute;
  inset: -10px -10px -10px -10px;
  z-index: 50;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  animation: modalFadeIn 0.25s ease-out;
}

html.dark .sub-cal-modal-overlay {
  background: rgba(18, 18, 20, 0.96);
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.sub-cal-modal-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  background: transparent;
  border: none;
  font-size: 20px;
  color: #a1a1aa;
  cursor: pointer;
  line-height: 1;
}

.sub-cal-modal-close-btn:hover {
  color: #18181b;
}

html.dark .sub-cal-modal-close-btn:hover {
  color: #ffffff;
}

.sub-cal-modal-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.bg-peach-light { background: #fee2e2; }
.bg-gray-light { background: #f4f4f5; }
.bg-purple-light { background: #f3e8ff; }

html.dark .bg-peach-light { background: rgba(250, 106, 46, 0.2); }
html.dark .bg-gray-light { background: #27272a; }
html.dark .bg-purple-light { background: rgba(168, 85, 247, 0.2); }

.sub-cal-modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #18181b;
  margin-bottom: 4px;
}

html.dark .sub-cal-modal-title {
  color: #f4f4f5;
}

.sub-cal-modal-desc {
  font-size: 11px;
  color: #71717a;
  text-align: center;
  margin-bottom: 18px;
}

.sub-cal-form-fields {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sub-cal-input-field {
  width: 100%;
  padding: 8px 12px;
  font-size: 12px;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  background: transparent;
  color: #18181b;
  outline: none;
  transition: border-color 0.2s;
}

.sub-cal-input-field:focus {
  border-color: #fa6a2e;
}

html.dark .sub-cal-input-field {
  border-color: #27272a;
  color: #f4f4f5;
}

.sub-cal-input-split {
  display: flex;
  gap: 8px;
}

.input-day-num {
  max-width: 90px;
}

.sub-cal-primary-submit-btn {
  margin-top: 4px;
  padding: 9px;
  background: #fa6a2e;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: opacity 0.2s;
}

.sub-cal-primary-submit-btn:hover {
  opacity: 0.9;
}

.sub-cal-search-box-wrap {
  width: 100%;
  margin-bottom: 12px;
}

.sub-cal-search-results-list {
  width: 100%;
  max-height: 140px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.search-result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  background: #f4f4f5;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.15s;
}

.search-result-row:hover {
  background: #fee2e2;
}

html.dark .search-result-row {
  background: #27272a;
}

html.dark .search-result-row:hover {
  background: rgba(250, 106, 46, 0.25);
}

.sub-cal-summary-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
  margin-top: 8px;
}

.sub-stat-tile {
  background: #f4f4f5;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

html.dark .sub-stat-tile {
  background: #27272a;
}

.tile-total-spend {
  grid-column: span 2;
  background: #fff7ed;
}

html.dark .tile-total-spend {
  background: rgba(250, 106, 46, 0.15);
}

.sub-tile-label {
  font-size: 10px;
  color: #71717a;
}

.sub-tile-val {
  font-size: 16px;
  font-weight: 700;
  color: #18181b;
}

html.dark .sub-tile-val {
  color: #f4f4f5;
}

.text-peach {
  color: #ba6542 !important;
}

/* Weekday Capsules Row */
.sub-cal-weekday-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.weekday-pill {
  text-align: center;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #71717a;
  background: #f4f4f5;
  border-radius: 9999px;
  padding: 4px 0;
}

html.dark .weekday-pill {
  background: #27272a;
  color: #a1a1aa;
}

/* 7-column Matrix Grid */
.sub-cal-days-matrix {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.sub-cal-day-cell {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  border: 1px solid #f4f4f5;
  background: rgba(244, 244, 245, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  color: #27272a;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 2px;
}

.sub-cal-day-cell:hover:not(.is-muted) {
  border-color: #d4d4d8;
  transform: translateY(-1px);
}

html.dark .sub-cal-day-cell {
  border-color: #222225;
  background: rgba(39, 39, 42, 0.35);
  color: #d4d4d8;
}

html.dark .sub-cal-day-cell:hover:not(.is-muted) {
  border-color: #3f3f46;
}

.sub-cal-day-cell.is-muted {
  border-color: transparent;
  background: transparent;
  color: #d4d4d8;
  cursor: default;
}

html.dark .sub-cal-day-cell.is-muted {
  color: #3f3f46;
}

/* Active Glow Layout Selection (watermelon.sh exact) */
.sub-cal-day-cell.is-active-glow {
  border: 1.5px solid #b3522f !important;
  background: #fff7ed !important;
  box-shadow: 0 0 16px rgba(179, 82, 47, 0.25);
  transform: scale(1.02);
}

html.dark .sub-cal-day-cell.is-active-glow {
  border-color: #fa6a2e !important;
  background: #32211a !important;
  box-shadow: 0 0 16px rgba(250, 106, 46, 0.35);
}

.sub-cell-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  line-height: 1;
}

.sub-cell-logo {
  font-size: 11px;
}

.sub-cell-dots-wrap {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 2px;
}

.sub-cell-indicator-dot {
  width: 5px;
  height: 5px;
  border-radius: 9999px;
}

.dot-purple { background: #a855f7; }
.dot-yellow { background: #facc15; }

/* Footer Meta */
.sub-cal-footer-meta {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #a1a1aa;
}

.sub-cal-legend-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sub-legend-dot-label {
  display: flex;
  align-items: center;
  gap: 5px;
}

.sub-bullet {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
}

.sub-cal-subs-counter {
  color: #71717a;
}

html.dark .sub-cal-subs-counter {
  color: #a1a1aa;
}

/* Bottom Toolbar */
.sub-cal-bottom-toolbar {
  margin-top: 14px;
  border-top: 1px solid #f4f4f5;
  padding-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

html.dark .sub-cal-bottom-toolbar {
  border-color: #27272a;
}

.sub-cal-tool-icons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sub-tool-btn {
  background: transparent;
  border: none;
  color: #a1a1aa;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.sub-tool-btn:hover {
  color: #18181b;
  background: #f4f4f5;
}

html.dark .sub-tool-btn:hover {
  color: #ffffff;
  background: #27272a;
}

.sub-tool-btn.is-loading .icon-download-svg {
  display: none;
}

.sub-tool-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #fa6a2e;
  border-top-color: transparent;
  border-radius: 9999px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.sub-cal-total-readout {
  font-size: 10px;
  font-weight: 600;
  color: #71717a;
}

.sub-cal-total-figure {
  font-size: 13px;
  font-weight: 700;
  color: #18181b;
  margin-left: 4px;
}

html.dark .sub-cal-total-figure {
  color: #f4f4f5;
}

/* Right Detail Card for Selected Day */
.sub-cal-detail-card {
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 26px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

html.dark .sub-cal-detail-card {
  background: #111113;
  border-color: #27272a;
}

.detail-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f4f4f5;
}

html.dark .detail-card-header {
  border-color: #27272a;
}

.detail-card-date {
  font-size: 20px;
  color: #18181b;
  margin-bottom: 2px;
}

html.dark .detail-card-date {
  color: #f4f4f5;
}

.detail-card-subtitle {
  font-size: 11px;
  color: #71717a;
}

.detail-selected-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 9999px;
  background: #f4f4f5;
  color: #71717a;
}

.detail-selected-badge.badge-today {
  background: #fee2e2;
  color: #ba6542;
}

.detail-items-feed {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 240px;
}

.detail-event-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #f4f4f5;
  background: #fafafb;
  transition: all 0.2s;
}

html.dark .detail-event-row {
  border-color: #27272a;
  background: #18181b;
}

.event-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.event-row-logo {
  font-size: 16px;
}

.event-row-name {
  font-size: 12px;
  font-weight: 600;
  color: #18181b;
  display: block;
}

html.dark .event-row-name {
  color: #f4f4f5;
}

.tag-sub {
  font-size: 9px;
  font-weight: 700;
  background: #f3e8ff;
  color: #9333ea;
  padding: 2px 6px;
  border-radius: 4px;
}

.event-row-cost {
  font-size: 14px;
  font-weight: 600;
  color: #18181b;
}

html.dark .event-row-cost {
  color: #f4f4f5;
}

.detail-add-event-btn {
  margin-top: 16px;
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  background: #18181b;
  color: #ffffff;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.2s;
}

.detail-add-event-btn:hover {
  background: #3f3f46;
}

html.dark .detail-add-event-btn {
  background: #faf8f5;
  color: #18181b;
}

html.dark .detail-add-event-btn:hover {
  background: #e4e4e7;
}

/* ==========================================================================
   DATED SHORT NOTES (JournalNavigation - watermelon.sh Specification)
   ========================================================================== */

.notes-mode-pills-wrap {
  display: flex;
  background: #f4f4f5;
  padding: 3px;
  border-radius: 9999px;
  gap: 2px;
}

html.dark .notes-mode-pills-wrap {
  background: #27272a;
}

.notes-mode-pill-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  font-size: 11.5px;
  font-weight: 600;
  border: none;
  background: transparent;
  color: #71717a;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
}

.notes-mode-pill-tab.active {
  background: #ffffff;
  color: #ba6542;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

html.dark .notes-mode-pill-tab.active {
  background: #18181b;
  color: #fa6a2e;
}

/* Journal Navigation Card */
.journal-navigation-outer-frame {
  display: flex;
  justify-content: center;
  padding: 10px 0 30px 0;
}

.journal-navigation-card {
  position: relative;
  display: flex;
  width: 100%;
  max-width: 640px;
  height: 480px;
  border-radius: 20px;
  border: 1px solid #e4e4e7;
  background: #f4f4f5;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  user-select: none;
}

html.dark .journal-navigation-card {
  background: #18181b;
  border-color: #27272a;
}

/* Left Vertical Date Scroller Tape */
.journal-date-tape-col {
  position: relative;
  width: 68px;
  margin: 6px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

html.dark .journal-date-tape-col {
  background: #111113;
  border-color: #27272a;
}

.tape-gradient-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.8) 40%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
  z-index: 20;
}

html.dark .tape-gradient-top {
  background: linear-gradient(180deg, rgba(17, 17, 19, 1) 0%, rgba(17, 17, 19, 0.8) 40%, rgba(17, 17, 19, 0) 100%);
}

.tape-gradient-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(0deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.8) 40%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
  z-index: 20;
}

html.dark .tape-gradient-bottom {
  background: linear-gradient(0deg, rgba(17, 17, 19, 1) 0%, rgba(17, 17, 19, 0.8) 40%, rgba(17, 17, 19, 0) 100%);
}

.journal-tape-reel-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  cursor: grab;
  transform: translateY(0);
}

.journal-tape-reel-track:active {
  cursor: grabbing;
}

.journal-tape-btn {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  background: transparent;
  border: none;
  color: #a1a1aa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.journal-tape-btn:hover {
  background: #f4f4f5;
  color: #18181b;
}

html.dark .journal-tape-btn:hover {
  background: #27272a;
  color: #ffffff;
}

/* Active Day in Vertical Reel (scaled 1.2x) */
.journal-tape-btn.is-active-tape-day {
  background: #fae9e2 !important;
  color: #ba6542 !important;
  transform: scale(1.22);
  box-shadow: 0 4px 12px rgba(186, 101, 66, 0.2);
}

html.dark .journal-tape-btn.is-active-tape-day {
  background: #32211a !important;
  color: #fa6a2e !important;
  box-shadow: 0 4px 12px rgba(250, 106, 46, 0.3);
}

/* Right Content Area */
.journal-entry-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  overflow: hidden;
}

.journal-entry-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

html.dark .journal-entry-top-bar {
  border-color: rgba(255, 255, 255, 0.05);
}

.journal-entry-date-digits {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.journal-entry-month {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #71717a;
}

.journal-entry-day-number {
  font-size: 30px;
  font-weight: 600;
  color: #18181b;
  line-height: 1;
}

html.dark .journal-entry-day-number {
  color: #f4f4f5;
}

.journal-entry-year {
  font-size: 12px;
  color: #a1a1aa;
}

.journal-entry-arrow-btns {
  display: flex;
  gap: 6px;
}

.journal-chevron-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e4e4e7;
  background: #ffffff;
  color: #71717a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.journal-chevron-btn:hover:not(:disabled) {
  background: #f4f4f5;
  color: #18181b;
}

.journal-chevron-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

html.dark .journal-chevron-btn {
  background: #111113;
  border-color: #27272a;
  color: #a1a1aa;
}

html.dark .journal-chevron-btn:hover:not(:disabled) {
  background: #27272a;
  color: #ffffff;
}

/* Journal Body */
.journal-entry-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 6px;
}

.journal-entry-title {
  font-size: 20px;
  color: #18181b;
  margin-bottom: 4px;
}

html.dark .journal-entry-title {
  color: #f4f4f5;
}

.journal-text-para {
  font-size: 13px;
  line-height: 1.6;
  color: #3f3f46;
}

html.dark .journal-text-para {
  color: #d4d4d8;
}

.journal-checklist-box {
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

html.dark .journal-checklist-box {
  background: #111113;
  border-color: #27272a;
}

.journal-box-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #71717a;
  margin-bottom: 2px;
}

.journal-check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  cursor: pointer;
}

.journal-check-text.is-done {
  text-decoration: line-through;
  color: #a1a1aa;
}

.journal-table-wrap {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e4e4e7;
}

html.dark .journal-table-wrap {
  border-color: #27272a;
}

.journal-data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
  background: #ffffff;
}

html.dark .journal-data-table {
  background: #111113;
}

.journal-data-table th,
.journal-data-table td {
  padding: 7px 10px;
  text-align: left;
  border-bottom: 1px solid #f4f4f5;
}

html.dark .journal-data-table th,
html.dark .journal-data-table td {
  border-bottom-color: #27272a;
}

.journal-data-table th {
  background: #fafafb;
  font-size: 10px;
  color: #71717a;
}

html.dark .journal-data-table th {
  background: #18181b;
}

/* Quick Input Bottom Bar */
.journal-entry-bottom-bar {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

html.dark .journal-entry-bottom-bar {
  border-top-color: rgba(255, 255, 255, 0.05);
}

.journal-quick-input-group {
  display: flex;
  gap: 8px;
}

.journal-log-input {
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  border-radius: 8px;
  border: 1px solid #e4e4e7;
  background: #ffffff;
  color: #18181b;
  outline: none;
  transition: border-color 0.2s;
}

.journal-log-input:focus {
  border-color: #ba6542;
}

html.dark .journal-log-input {
  background: #111113;
  border-color: #27272a;
  color: #f4f4f5;
}

.journal-log-submit-btn {
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  background: #ba6542;
  color: #ffffff;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.journal-log-submit-btn:hover {
  opacity: 0.9;
}
`;

fs.writeFileSync(cssPath, css + '\n' + newStyles, 'utf8');
console.log('Successfully appended SubscriptionCalendar & JournalNavigation styles to src/style.css!');
