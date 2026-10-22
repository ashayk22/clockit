const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. New Calendar HTML (SubscriptionCalendar from watermelon.sh)
const newCalendarHtml = `          <!-- ==================================================================
               VIEW 3: CALENDAR (Subscription & Sprint Calendar - watermelon.sh)
               ================================================================== -->
          <div class="tracker-view" id="tracker-view-calendar" hidden>
            <div class="tracker-view-header">
              <div class="header-titles">
                <h1 class="tracker-page-title font-serif">Subscription &amp; Sprint Calendar</h1>
                <p class="tracker-page-subtitle">Track recurring payments, service subscriptions, and sprint delivery milestones.</p>
              </div>
              <div class="header-right-tools">
                <span class="sub-cal-badge-pill">Sprint 12 &bull; Active</span>
              </div>
            </div>

            <div class="tracker-calendar-layout">
              <!-- Left / Main Card: Subscription Calendar -->
              <div class="sub-cal-widget-card" id="subscription-calendar-widget">
                <!-- Header -->
                <div class="sub-cal-top-bar">
                  <div class="sub-cal-meta-group">
                    <h2 class="sub-cal-month-heading" id="sub-cal-month-year">October, 2026</h2>
                    <button class="sub-cal-today-pill" id="sub-cal-today-btn" type="button">Today</button>
                    <div class="sub-cal-arrow-controls">
                      <button class="sub-cal-icon-nav" id="sub-cal-prev-month" title="Previous Month" type="button">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </button>
                      <button class="sub-cal-icon-nav" id="sub-cal-next-month" title="Next Month" type="button">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                    </div>
                  </div>
                  <button class="sub-cal-plus-cta" id="sub-cal-quick-add-btn" title="Quick Add Subscription" type="button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                </div>

                <!-- Days Container with embedded overlay modals -->
                <div class="sub-cal-viewport-container">
                  <!-- Quick Add Modal Overlay -->
                  <div class="sub-cal-modal-overlay" id="sub-cal-add-modal" hidden>
                    <button class="sub-cal-modal-close-btn" id="sub-cal-add-close" type="button">&times;</button>
                    <div class="sub-cal-modal-icon-wrap bg-peach-light">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fa6a2e" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                    <h3 class="sub-cal-modal-title font-serif">Quick Add Subscription</h3>
                    <p class="sub-cal-modal-desc">Enter the details of your new recurring payment or deadline.</p>
                    <div class="sub-cal-form-fields">
                      <input type="text" class="sub-cal-input-field" id="sub-add-name" placeholder="Service Name (e.g. Netflix, AWS, Figma)">
                      <div class="sub-cal-input-split">
                        <input type="text" class="sub-cal-input-field" id="sub-add-amount" placeholder="Amount (e.g. $15.99)">
                        <input type="number" class="sub-cal-input-field input-day-num" id="sub-add-date" placeholder="Date (1-31)" min="1" max="31">
                      </div>
                      <button class="sub-cal-primary-submit-btn" id="sub-add-submit-btn" type="button">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Add Subscription</span>
                      </button>
                    </div>
                  </div>

                  <!-- Search Modal Overlay -->
                  <div class="sub-cal-modal-overlay" id="sub-cal-search-modal" hidden>
                    <button class="sub-cal-modal-close-btn" id="sub-cal-search-close" type="button">&times;</button>
                    <div class="sub-cal-modal-icon-wrap bg-gray-light">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <h3 class="sub-cal-modal-title font-serif">Search Subscriptions</h3>
                    <div class="sub-cal-search-box-wrap">
                      <input type="text" class="sub-cal-input-field" id="sub-cal-search-input" placeholder="Type to search...">
                    </div>
                    <div class="sub-cal-search-results-list" id="sub-cal-search-results">
                      <p class="sub-cal-empty-hint">Start typing to see results</p>
                    </div>
                  </div>

                  <!-- Monthly Summary Modal Overlay -->
                  <div class="sub-cal-modal-overlay" id="sub-cal-summary-modal" hidden>
                    <button class="sub-cal-modal-close-btn" id="sub-cal-summary-close" type="button">&times;</button>
                    <div class="sub-cal-modal-icon-wrap bg-purple-light">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg>
                    </div>
                    <h3 class="sub-cal-modal-title font-serif">Monthly Summary</h3>
                    <div class="sub-cal-summary-cards-grid">
                      <div class="sub-stat-tile">
                        <span class="sub-tile-label">Active</span>
                        <span class="sub-tile-val" id="summary-active-count">14</span>
                      </div>
                      <div class="sub-stat-tile">
                        <span class="sub-tile-label">New</span>
                        <span class="sub-tile-val" id="summary-new-count">3</span>
                      </div>
                      <div class="sub-stat-tile tile-total-spend">
                        <span class="sub-tile-label text-peach">Total Spend</span>
                        <span class="sub-tile-val text-peach" id="summary-total-spend">$148.50</span>
                      </div>
                    </div>
                  </div>

                  <!-- Weekdays Header Row -->
                  <div class="sub-cal-weekday-labels">
                    <span class="weekday-pill">MON</span>
                    <span class="weekday-pill">TUE</span>
                    <span class="weekday-pill">WED</span>
                    <span class="weekday-pill">THU</span>
                    <span class="weekday-pill">FRI</span>
                    <span class="weekday-pill">SAT</span>
                    <span class="weekday-pill">SUN</span>
                  </div>

                  <!-- 7-column Calendar Day Grid (Filled by JS) -->
                  <div class="sub-cal-days-matrix" id="sub-cal-days-matrix">
                    <!-- Day cell elements -->
                  </div>
                </div>

                <!-- Footer Info -->
                <div class="sub-cal-footer-meta">
                  <div class="sub-cal-legend-group">
                    <span class="sub-legend-dot-label">
                      <span class="sub-bullet dot-purple"></span>
                      MONTHLY
                    </span>
                    <span class="sub-legend-dot-label">
                      <span class="sub-bullet dot-yellow"></span>
                      YEARLY
                    </span>
                  </div>
                  <span class="sub-cal-subs-counter" id="sub-cal-counts-label">14 SUBS / 3 NEW</span>
                </div>

                <!-- Bottom Action Bar -->
                <div class="sub-cal-bottom-toolbar">
                  <div class="sub-cal-tool-icons">
                    <button class="sub-tool-btn" id="sub-tool-search-trigger" title="Search Subscriptions" type="button">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                    <button class="sub-tool-btn" id="sub-tool-download-btn" title="Export schedule" type="button">
                      <svg class="icon-download-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      <span class="sub-tool-spinner" id="sub-download-spinner" hidden></span>
                    </button>
                    <button class="sub-tool-btn" id="sub-tool-cube-trigger" title="Monthly Summary" type="button">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg>
                    </button>
                  </div>
                  <div class="sub-cal-total-readout">
                    MONTHLY TOTAL : <span class="sub-cal-total-figure" id="sub-cal-total-display">$148.50</span>
                  </div>
                </div>
              </div><!-- /sub-cal-widget-card -->

              <!-- Right: Selected Day Schedule & Linked Subscriptions/Tasks -->
              <div class="sub-cal-detail-card" id="sub-cal-detail-card">
                <div class="detail-card-header">
                  <div>
                    <h3 class="detail-card-date font-serif" id="sub-selected-date-title">Wednesday, October 28</h3>
                    <p class="detail-card-subtitle" id="sub-selected-date-subtitle">Scheduled billing &amp; sprint milestones</p>
                  </div>
                  <span class="detail-selected-badge" id="sub-selected-status-badge">Selected</span>
                </div>
                <div class="detail-items-feed" id="sub-selected-items-feed">
                  <!-- Injected by JS -->
                </div>
                <button class="detail-add-event-btn" id="sub-detail-add-event-btn" type="button">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span>Add event for this day</span>
                </button>
              </div>
            </div><!-- /tracker-calendar-layout -->
          </div><!-- /tracker-view-calendar -->`;

// 2. New Notes HTML (Dated Short Notes JournalNavigation + Obsidian Knowledge Graph workspace)
const newNotesHtml = `          <!-- ==================================================================
               VIEW 4: NOTES (Dated Short Notes Journal + Obsidian Knowledge Graph)
               ================================================================== -->
          <div class="tracker-view" id="tracker-view-notes" hidden>
            <div class="tracker-view-header">
              <div class="header-titles">
                <h1 class="tracker-page-title font-serif">Dated Notes &amp; Knowledge Graph</h1>
                <p class="tracker-page-subtitle">Dated daily journal navigation with Obsidian-style interconnected documentation.</p>
              </div>
              <div class="header-right-tools">
                <div class="notes-mode-pills-wrap" id="notes-view-mode-pills">
                  <button class="notes-mode-pill-tab active" data-mode="journal" type="button">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span>Dated Journal</span>
                  </button>
                  <button class="notes-mode-pill-tab" data-mode="graph" type="button">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    <span>Knowledge Graph &amp; Docs</span>
                  </button>
                </div>
                <button class="tracker-new-issue-btn" id="notes-new-btn" type="button">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span>New entry</span>
                </button>
              </div>
            </div>

            <!-- MODE 1: DATED SHORT NOTES (JournalNavigation - watermelon.sh) -->
            <div class="journal-navigation-outer-frame" id="journal-navigation-view">
              <div class="journal-navigation-card">
                <!-- Left Vertical Date Tape Column -->
                <div class="journal-date-tape-col">
                  <div class="tape-gradient-top" aria-hidden="true"></div>
                  <div class="journal-tape-reel-track" id="journal-tape-track">
                    <!-- Day buttons 01-31 dynamically rendered and scrolled -->
                  </div>
                  <div class="tape-gradient-bottom" aria-hidden="true"></div>
                </div>

                <!-- Right Journal Entry Content Area -->
                <div class="journal-entry-viewport">
                  <!-- Header: Animated Month & Day + Nav Chevrons -->
                  <div class="journal-entry-top-bar">
                    <div class="journal-entry-date-digits">
                      <span class="journal-entry-month" id="journal-entry-month-label">OCTOBER</span>
                      <span class="journal-entry-day-number font-serif" id="journal-entry-day-label">15</span>
                      <span class="journal-entry-year" id="journal-entry-year-label">2026</span>
                    </div>

                    <div class="journal-entry-arrow-btns">
                      <button class="journal-chevron-btn" id="journal-prev-btn" title="Previous entry" type="button">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </button>
                      <button class="journal-chevron-btn" id="journal-next-btn" title="Next entry" type="button">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Entry Content Display (Staggered Animation) -->
                  <div class="journal-entry-body" id="journal-entry-body">
                    <!-- Text paragraphs, interactive checklists, tables -->
                  </div>

                  <!-- Quick Log Entry Input Bar -->
                  <div class="journal-entry-bottom-bar">
                    <div class="journal-quick-input-group">
                      <input type="text" class="journal-log-input" id="journal-quick-input" placeholder="Add a log entry, checklist (- [ ] task), or note for this day...">
                      <button class="journal-log-submit-btn" id="journal-log-submit-btn" type="button">Log Entry</button>
                    </div>
                  </div>
                </div>
              </div><!-- /journal-navigation-card -->
            </div><!-- /journal-navigation-outer-frame -->

            <!-- MODE 2: OBSIDIAN KNOWLEDGE GRAPH & 3-PANEL MARKDOWN DOCS -->
            <div class="tracker-notes-container" id="tracker-notes-graph-view" hidden>
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
            </div><!-- /tracker-notes-graph-view -->
          </div><!-- /tracker-view-notes -->`;

// Replace calendar view
const calStart = '<!-- ==================================================================\n               VIEW 3: CALENDAR';
const calEnd = '</div><!-- /tracker-view-calendar -->';
const calStartIdx = html.indexOf(calStart);
const calEndIdx = html.indexOf(calEnd, calStartIdx);

if (calStartIdx !== -1 && calEndIdx !== -1) {
  const beforeCal = html.substring(0, calStartIdx);
  const afterCal = html.substring(calEndIdx + calEnd.length);
  html = beforeCal + newCalendarHtml + afterCal;
  console.log('Successfully replaced Calendar view in index.html');
} else {
  console.error('Could not locate Calendar view markers in index.html');
}

// Replace notes view
const notesStart = '<!-- ==================================================================\n               VIEW 4: NOTES';
const notesEnd = '</div><!-- /tracker-view-notes -->';
const notesStartIdx = html.indexOf(notesStart);
const notesEndIdx = html.indexOf(notesEnd, notesStartIdx);

if (notesStartIdx !== -1 && notesEndIdx !== -1) {
  const beforeNotes = html.substring(0, notesStartIdx);
  const afterNotes = html.substring(notesEndIdx + notesEnd.length);
  html = beforeNotes + newNotesHtml + afterNotes;
  console.log('Successfully replaced Notes view in index.html');
} else {
  console.error('Could not locate Notes view markers in index.html');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Finished updating index.html!');
