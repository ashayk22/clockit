/**
 * Interactive Onboarding & Sequential Product Tour Service (Phase 12.4).
 *
 * Implements a sequential, multi-page guided product tour covering 11 core stages:
 *  1. Dashboard (/app)
 *  2. Tasks (/app/tasks)
 *  3. Workspaces (/app/workspaces)
 *  4. Calendar (/app/calendar)
 *  5. Focus / Pomodoro (/app/focus)
 *  6. Habits (/app/habits)
 *  7. Notes (/app/notes)
 *  8. Quick Notes (/app)
 *  9. Timeline (/app)
 *  10. Analytics (/app/analytics)
 *  11. Settings & Profile (/app/settings)
 *
 * Progress is persisted locally (localStorage) and synchronized to Supabase
 * via `preferencesRepository` (`notificationReadKeys` with `tutorial:*` keys).
 */
import { preferencesRepository } from './repositories';

export interface TourStep {
  id: string;
  pageId: string;
  pageTitle: string;
  stepNumberInPage: number;
  totalStepsInPage: number;
  title: string;
  description: string;
  tip?: string;
  shortcut?: string;
  targetSelector?: string;
  route: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface TourPage {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  route: string;
  steps: TourStep[];
}

export const TOUR_PAGES: TourPage[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    subtitle: 'Your daily cockpit for tasks, focus, and timeline',
    iconName: 'LayoutDashboard',
    route: '/app',
    steps: [
      {
        id: 'dash-overview',
        pageId: 'dashboard',
        pageTitle: 'Dashboard',
        stepNumberInPage: 1,
        totalStepsInPage: 6,
        title: 'Welcome to ClockIt',
        description: 'ClockIt unites task tracking, deep-work countdowns, daily habits, and personal knowledge into one cohesive workspace.',
        tip: 'Check your daily metrics at a glance to stay centered on what moves the needle.',
        targetSelector: '.clockit-hero-card, .clockit-home-container',
        route: '/app',
        position: 'center',
      },
      {
        id: 'dash-metrics',
        pageId: 'dashboard',
        pageTitle: 'Dashboard',
        stepNumberInPage: 2,
        totalStepsInPage: 6,
        title: 'Daily Performance Metrics',
        description: 'Track your focus minutes, pending tasks, habit consistency, and upcoming deadlines in real time.',
        targetSelector: '.clockit-home-snapshot, .clockit-snapshot-card',
        route: '/app',
        position: 'bottom',
      },
      {
        id: 'dash-focus-launcher',
        pageId: 'dashboard',
        pageTitle: 'Dashboard',
        stepNumberInPage: 3,
        totalStepsInPage: 6,
        title: 'Quick Focus Launcher',
        description: 'Jump straight into deep work sessions directly from your dashboard without opening a new tab.',
        shortcut: 'Click the start button to begin a focus block',
        targetSelector: '.clockit-hero-focus-block, .clockit-focus-btn',
        route: '/app',
        position: 'left',
      },
      {
        id: 'dash-tasks',
        pageId: 'dashboard',
        pageTitle: 'Dashboard',
        stepNumberInPage: 4,
        totalStepsInPage: 6,
        title: "Today's Task Summary",
        description: 'Review tasks scheduled for today, complete items with one click, and see remaining workload.',
        targetSelector: '.clockit-tasks-card, .clockit-today-card',
        route: '/app',
        position: 'right',
      },
      {
        id: 'dash-calendar',
        pageId: 'dashboard',
        pageTitle: 'Dashboard',
        stepNumberInPage: 5,
        totalStepsInPage: 6,
        title: 'Mini Calendar & Schedule',
        description: 'Visual month preview highlights days with events, active tasks, and impending deadlines.',
        targetSelector: '[data-widget="calendar"], .clockit-calendar-grid',
        route: '/app',
        position: 'left',
      },
      {
        id: 'dash-timeline',
        pageId: 'dashboard',
        pageTitle: 'Dashboard',
        stepNumberInPage: 6,
        totalStepsInPage: 6,
        title: "Today's Schedule & Timeline",
        description: 'Chronological timeline of your scheduled blocks, meetings, and habits scheduled for today.',
        targetSelector: '[data-widget="today"], .clockit-today-item',
        route: '/app',
        position: 'left',
      },
    ],
  },
  {
    id: 'tasks',
    title: 'Tasks',
    subtitle: 'Organize tasks with deadlines, estimates, and Kanban workflows',
    iconName: 'CheckSquare',
    route: '/app/tasks',
    steps: [
      {
        id: 'task-overview',
        pageId: 'tasks',
        pageTitle: 'Tasks',
        stepNumberInPage: 1,
        totalStepsInPage: 6,
        title: 'Task Management Engine',
        description: 'Keep your projects organized with deadlines, priorities, workspace tags, and flexible view modes.',
        targetSelector: '.clockit-page-header-row',
        route: '/app/tasks',
        position: 'bottom',
      },
      {
        id: 'task-add',
        pageId: 'tasks',
        pageTitle: 'Tasks',
        stepNumberInPage: 2,
        totalStepsInPage: 6,
        title: 'Create and Plan Tasks',
        description: 'Create tasks with detailed descriptions, estimated durations, and priority levels from Low to Critical.',
        shortcut: 'Ctrl + N or click "New Task"',
        targetSelector: 'button.clockit-primary-btn',
        route: '/app/tasks',
        position: 'bottom',
      },
      {
        id: 'task-filters',
        pageId: 'tasks',
        pageTitle: 'Tasks',
        stepNumberInPage: 3,
        totalStepsInPage: 6,
        title: 'Smart Filter Tabs',
        description: 'Filter your tasks by All, Today, Upcoming, Someday, Completed, or Overdue to narrow your focus immediately.',
        targetSelector: '.clockit-filter-pills',
        route: '/app/tasks',
        position: 'bottom',
      },
      {
        id: 'task-quick-add',
        pageId: 'tasks',
        pageTitle: 'Tasks',
        stepNumberInPage: 4,
        totalStepsInPage: 6,
        title: 'Quick Add & Sorting',
        description: 'Type a task title in the quick input and hit Enter to instantly capture ideas without opening a dialog.',
        targetSelector: '.clockit-tasks-sort, .clockit-quick-add-input',
        route: '/app/tasks',
        position: 'bottom',
      },
      {
        id: 'task-row',
        pageId: 'tasks',
        pageTitle: 'Tasks',
        stepNumberInPage: 5,
        totalStepsInPage: 6,
        title: 'Task Actions & Prioritization',
        description: 'Check off completed tasks, view assigned workspaces, and click the menu button to edit, reschedule, or link to focus.',
        targetSelector: '.clockit-task-row',
        route: '/app/tasks',
        position: 'top',
      },
      {
        id: 'task-sidebar',
        pageId: 'tasks',
        pageTitle: 'Tasks',
        stepNumberInPage: 6,
        totalStepsInPage: 6,
        title: 'Calendar & Productivity Widgets',
        description: 'The right side panel gives you quick calendar filtering and weekly completion metrics at all times.',
        targetSelector: '.clockit-widgets-column, .clockit-card',
        route: '/app/tasks',
        position: 'left',
      },
    ],
  },
  {
    id: 'workspaces',
    title: 'Workspaces',
    subtitle: 'Separate personal life, college, client work, and side projects',
    iconName: 'FolderKanban',
    route: '/app/workspaces',
    steps: [
      {
        id: 'ws-overview',
        pageId: 'workspaces',
        pageTitle: 'Workspaces',
        stepNumberInPage: 1,
        totalStepsInPage: 4,
        title: 'Context Separation',
        description: 'Workspaces let you partition tasks, calendar items, and notes between Personal, College, Work, and Side Projects.',
        targetSelector: '.workspace-overview-head',
        route: '/app/workspaces',
        position: 'bottom',
      },
      {
        id: 'ws-create',
        pageId: 'workspaces',
        pageTitle: 'Workspaces',
        stepNumberInPage: 2,
        totalStepsInPage: 4,
        title: 'Create Custom Spaces',
        description: 'Create dedicated workspaces with custom accent colors, icons, and descriptions tailored to your workflow.',
        targetSelector: 'button.workspace-primary-button',
        route: '/app/workspaces',
        position: 'bottom',
      },
      {
        id: 'ws-view-switch',
        pageId: 'workspaces',
        pageTitle: 'Workspaces',
        stepNumberInPage: 3,
        totalStepsInPage: 4,
        title: 'Layout Customization',
        description: 'Toggle between comfortable card view and compact table view depending on how many spaces you manage.',
        targetSelector: '.workspace-view-switch',
        route: '/app/workspaces',
        position: 'left',
      },
      {
        id: 'ws-cards',
        pageId: 'workspaces',
        pageTitle: 'Workspaces',
        stepNumberInPage: 4,
        totalStepsInPage: 4,
        title: 'Workspace Navigation',
        description: 'Each card summarizes active tasks and recent items. Click any workspace to view its dedicated filtered dashboard.',
        targetSelector: '.workspace-card',
        route: '/app/workspaces',
        position: 'top',
      },
    ],
  },
  {
    id: 'calendar',
    title: 'Calendar',
    subtitle: 'Monthly visual planner with deadlines and scheduled focus blocks',
    iconName: 'Calendar',
    route: '/app/calendar',
    steps: [
      {
        id: 'cal-header',
        pageId: 'calendar',
        pageTitle: 'Calendar',
        stepNumberInPage: 1,
        totalStepsInPage: 4,
        title: 'Calendar Views & Navigation',
        description: 'Switch between Month, Week, and Day views, and use the quick date arrows to navigate across months effortlessly.',
        targetSelector: '.clockit-page-header-row',
        route: '/app/calendar',
        position: 'bottom',
      },
      {
        id: 'cal-create-event',
        pageId: 'calendar',
        pageTitle: 'Calendar',
        stepNumberInPage: 2,
        totalStepsInPage: 4,
        title: 'Schedule New Events',
        description: 'Add scheduled events, milestones, or deep-work intervals with specific start times and durations.',
        targetSelector: 'button.clockit-primary-btn',
        route: '/app/calendar',
        position: 'bottom',
      },
      {
        id: 'cal-grid',
        pageId: 'calendar',
        pageTitle: 'Calendar',
        stepNumberInPage: 3,
        totalStepsInPage: 4,
        title: 'Visual Month Grid',
        description: 'View deadlines and events color-coded by workspace. Click any calendar cell to view or schedule items for that day.',
        targetSelector: '.clockit-calendar-main-grid, .clockit-month-calendar-table',
        route: '/app/calendar',
        position: 'top',
      },
      {
        id: 'cal-today-col',
        pageId: 'calendar',
        pageTitle: 'Calendar',
        stepNumberInPage: 4,
        totalStepsInPage: 4,
        title: "Today's Agenda Feed",
        description: 'The right-hand agenda panel lists chronological events, tasks, and habit check-ins for the active date.',
        targetSelector: '.clockit-calendar-today-col, .clockit-card',
        route: '/app/calendar',
        position: 'left',
      },
    ],
  },
  {
    id: 'focus',
    title: 'Focus Timer',
    subtitle: 'Deep-work countdown dial with customizable intervals and task linking',
    iconName: 'Timer',
    route: '/app/focus',
    steps: [
      {
        id: 'focus-dial',
        pageId: 'focus',
        pageTitle: 'Focus Timer',
        stepNumberInPage: 1,
        totalStepsInPage: 5,
        title: 'Minimalist Countdown Dial',
        description: 'The circular countdown dial gives you an immediate visual cue of elapsed and remaining focus time.',
        targetSelector: '.clockit-dial-svg, .clockit-dial-digits',
        route: '/app/focus',
        position: 'right',
      },
      {
        id: 'focus-modes',
        pageId: 'focus',
        pageTitle: 'Focus Timer',
        stepNumberInPage: 2,
        totalStepsInPage: 5,
        title: 'Mode Switching',
        description: 'Switch between Deep Work (default 25-90 min), Short Break (5 min), and Long Break (15 min) with one click.',
        targetSelector: '.clockit-focus-mode-switch',
        route: '/app/focus',
        position: 'bottom',
      },
      {
        id: 'focus-controls',
        pageId: 'focus',
        pageTitle: 'Focus Timer',
        stepNumberInPage: 3,
        totalStepsInPage: 5,
        title: 'Start, Pause & Reset Controls',
        description: 'Start and pause your countdown at any time. Timer calculates progress drift-free from wall-clock timestamps.',
        shortcut: 'Spacebar to toggle play/pause',
        targetSelector: '.clockit-timer-start-btn, .clockit-timer-controls-bar',
        route: '/app/focus',
        position: 'top',
      },
      {
        id: 'focus-task-link',
        pageId: 'focus',
        pageTitle: 'Focus Timer',
        stepNumberInPage: 4,
        totalStepsInPage: 5,
        title: 'Link Sessions to Tasks',
        description: 'Select an active task before starting your session. ClockIt logs your focus minutes directly to that task!',
        targetSelector: '.clockit-focus-target-select, .clockit-focus-target-row',
        route: '/app/focus',
        position: 'bottom',
      },
      {
        id: 'focus-settings',
        pageId: 'focus',
        pageTitle: 'Focus Timer',
        stepNumberInPage: 5,
        totalStepsInPage: 5,
        title: 'Timer Settings & Zen Mode',
        description: 'Click the settings icon to customize session durations, or use Zen Mode for an immersive distraction-free view.',
        targetSelector: '.clockit-timer-controls-bar',
        route: '/app/focus',
        position: 'top',
      },
    ],
  },
  {
    id: 'habits',
    title: 'Habits',
    subtitle: 'Daily routine checklist, streak counts, and monthly heatmaps',
    iconName: 'Flame',
    route: '/app/habits',
    steps: [
      {
        id: 'habit-kpis',
        pageId: 'habits',
        pageTitle: 'Habits',
        stepNumberInPage: 1,
        totalStepsInPage: 5,
        title: 'Habit Consistency KPIs',
        description: 'Review your longest streaks, daily completion percentages, and consistency metrics to stay motivated.',
        targetSelector: '.clockit-stats-grid-4',
        route: '/app/habits',
        position: 'bottom',
      },
      {
        id: 'habit-create',
        pageId: 'habits',
        pageTitle: 'Habits',
        stepNumberInPage: 2,
        totalStepsInPage: 5,
        title: 'Build Daily Routines',
        description: 'Add positive habits like morning workouts, deep reading, or coding drills, and assign them to workspaces.',
        targetSelector: 'button.clockit-primary-btn',
        route: '/app/habits',
        position: 'bottom',
      },
      {
        id: 'habit-checklist',
        pageId: 'habits',
        pageTitle: 'Habits',
        stepNumberInPage: 3,
        totalStepsInPage: 5,
        title: 'Daily Checklist',
        description: 'Check off habits each day. Completing habits records instant progress and extends your active streak.',
        targetSelector: '.clockit-task-row',
        route: '/app/habits',
        position: 'top',
      },
      {
        id: 'habit-streak',
        pageId: 'habits',
        pageTitle: 'Habits',
        stepNumberInPage: 4,
        totalStepsInPage: 5,
        title: 'Streak Counter & Flame',
        description: 'Every completed day adds to your streak flame. Consistency compounds over weeks and months.',
        targetSelector: '.clockit-habit-streak-flame, .clockit-task-row',
        route: '/app/habits',
        position: 'left',
      },
      {
        id: 'habit-heatmap',
        pageId: 'habits',
        pageTitle: 'Habits',
        stepNumberInPage: 5,
        totalStepsInPage: 5,
        title: 'Monthly Consistency Heatmap',
        description: 'Inspect your full 31-day visual ring heatmap to observe your habit compliance pattern across the entire month.',
        targetSelector: '.clockit-habit-calendar-grid',
        route: '/app/habits',
        position: 'top',
      },
    ],
  },
  {
    id: 'notes',
    title: 'Notes',
    subtitle: 'Rich text notes with markdown, task lists, and bidirectional links',
    iconName: 'FileText',
    route: '/app/notes',
    steps: [
      {
        id: 'notes-sidebar',
        pageId: 'notes',
        pageTitle: 'Notes',
        stepNumberInPage: 1,
        totalStepsInPage: 4,
        title: 'Personal Knowledge Base',
        description: 'Organize project documentation, meeting summaries, and research in one unified notebook.',
        targetSelector: '.clockit-notes-sidebar',
        route: '/app/notes',
        position: 'right',
      },
      {
        id: 'notes-folders',
        pageId: 'notes',
        pageTitle: 'Notes',
        stepNumberInPage: 2,
        totalStepsInPage: 4,
        title: 'Hierarchical Folders',
        description: 'Group notes by topics such as Personal, Projects, and Archives with intuitive folder trees.',
        targetSelector: '.clockit-notes-subfolder-list, .clockit-notes-section-label',
        route: '/app/notes',
        position: 'right',
      },
      {
        id: 'notes-tags',
        pageId: 'notes',
        pageTitle: 'Notes',
        stepNumberInPage: 3,
        totalStepsInPage: 4,
        title: 'Tags & Quick Filters',
        description: 'Label notes with tags like #ideas, #dev, or #strategy to filter notes across different folders rapidly.',
        targetSelector: '.clockit-notes-tag-list',
        route: '/app/notes',
        position: 'right',
      },
      {
        id: 'notes-editor',
        pageId: 'notes',
        pageTitle: 'Notes',
        stepNumberInPage: 4,
        totalStepsInPage: 4,
        title: 'Editor & Bidirectional Wiki-Links',
        description: 'Write notes with formatting, task checkboxes, and connect notes using [[Note Title]] wiki-links.',
        tip: 'Type [[ inside any note to link another note instantly.',
        targetSelector: '.clockit-notes-editor-bar, .clockit-notes-page main',
        route: '/app/notes',
        position: 'left',
      },
    ],
  },
  {
    id: 'quick_notes',
    title: 'Quick Notes',
    subtitle: 'Capture fleeting thoughts instantly without leaving your current task',
    iconName: 'Sparkles',
    route: '/app',
    steps: [
      {
        id: 'qn-card',
        pageId: 'quick_notes',
        pageTitle: 'Quick Notes',
        stepNumberInPage: 1,
        totalStepsInPage: 3,
        title: 'Dashboard Scratchpad',
        description: 'Quick Notes is always pinned right on your Dashboard for fleeting ideas, phone numbers, or code snippets.',
        targetSelector: '.clockit-quick-notes-card, .clockit-quick-notes',
        route: '/app',
        position: 'left',
      },
      {
        id: 'qn-capture',
        pageId: 'quick_notes',
        pageTitle: 'Quick Notes',
        stepNumberInPage: 2,
        totalStepsInPage: 3,
        title: 'Instant Capture & Auto-save',
        description: 'Type freely in the scratchpad. Every keystroke is saved immediately to local storage and your cloud profile.',
        targetSelector: '.clockit-quick-notes-card textarea, .clockit-quick-notes',
        route: '/app',
        position: 'left',
      },
      {
        id: 'qn-expand',
        pageId: 'quick_notes',
        pageTitle: 'Quick Notes',
        stepNumberInPage: 3,
        totalStepsInPage: 3,
        title: 'Expanded Modal View',
        description: 'Click the expand button whenever you need a full-width popup canvas for outlining larger ideas.',
        targetSelector: '.clockit-quick-notes-card button, .clockit-quick-notes-card',
        route: '/app',
        position: 'left',
      },
    ],
  },
  {
    id: 'timeline',
    title: 'Timeline',
    subtitle: 'Chronological schedule of events and focus blocks',
    iconName: 'Clock',
    route: '/app',
    steps: [
      {
        id: 'tl-card',
        pageId: 'timeline',
        pageTitle: 'Timeline',
        stepNumberInPage: 1,
        totalStepsInPage: 2,
        title: 'Chronological Day Schedule',
        description: 'Review your day from morning to evening. Calendar entries and logged deep work blocks appear in order.',
        targetSelector: '[data-widget="today"], .clockit-tasks-card',
        route: '/app',
        position: 'left',
      },
      {
        id: 'tl-flow',
        pageId: 'timeline',
        pageTitle: 'Timeline',
        stepNumberInPage: 2,
        totalStepsInPage: 2,
        title: 'Integrated Time Blocking',
        description: 'Time blocks highlight upcoming sessions and past completed work so you never lose momentum.',
        targetSelector: '.clockit-today-item, [data-widget="today"]',
        route: '/app',
        position: 'left',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    subtitle: 'Productivity trends, focus distributions, and task completion metrics',
    iconName: 'LayoutDashboard',
    route: '/app/analytics',
    steps: [
      {
        id: 'analytics-cockpit',
        pageId: 'analytics',
        pageTitle: 'Analytics',
        stepNumberInPage: 1,
        totalStepsInPage: 4,
        title: 'Productivity Analytics Cockpit',
        description: 'Gain insight into your work rhythms, total focus hours, completed tasks, and knowledge growth.',
        targetSelector: '.clockit-page-header-row',
        route: '/app/analytics',
        position: 'bottom',
      },
      {
        id: 'analytics-range',
        pageId: 'analytics',
        pageTitle: 'Analytics',
        stepNumberInPage: 2,
        totalStepsInPage: 4,
        title: 'Timeframe Filtering',
        description: 'Filter your analytics by Last 7 Days, Last 14 Days, or Last 30 Days to analyze trends across weeks.',
        targetSelector: '.clockit-range-control',
        route: '/app/analytics',
        position: 'bottom',
      },
      {
        id: 'analytics-kpis',
        pageId: 'analytics',
        pageTitle: 'Analytics',
        stepNumberInPage: 3,
        totalStepsInPage: 4,
        title: 'KPI Cards & Completion Rates',
        description: 'Monitor key metrics: total minutes in deep focus, task completion rate percentage, and habit consistency score.',
        targetSelector: '.clockit-stats-grid-4',
        route: '/app/analytics',
        position: 'bottom',
      },
      {
        id: 'analytics-charts',
        pageId: 'analytics',
        pageTitle: 'Analytics',
        stepNumberInPage: 4,
        totalStepsInPage: 4,
        title: 'Visual Focus Distribution Charts',
        description: 'Interactive charts display focus session distribution across workspaces and daily deep-work hours.',
        targetSelector: '.clockit-chart-grid',
        route: '/app/analytics',
        position: 'top',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    subtitle: 'Account identity, appearance themes, personalization, and tour replay',
    iconName: 'Settings',
    route: '/app/settings',
    steps: [
      {
        id: 'settings-profile',
        pageId: 'settings',
        pageTitle: 'Settings',
        stepNumberInPage: 1,
        totalStepsInPage: 5,
        title: 'Account Identity & Profile',
        description: 'Update your display name and view your authenticated account email address.',
        targetSelector: '.clockit-user-avatar, .clockit-card',
        route: '/app/settings',
        position: 'bottom',
      },
      {
        id: 'settings-theme',
        pageId: 'settings',
        pageTitle: 'Settings',
        stepNumberInPage: 2,
        totalStepsInPage: 5,
        title: 'Appearance Theme',
        description: 'Toggle between Warm Light mode, Deep Dark mode, or automatic System matching anytime.',
        targetSelector: '.clockit-card',
        route: '/app/settings',
        position: 'bottom',
      },
      {
        id: 'settings-personalization',
        pageId: 'settings',
        pageTitle: 'Settings',
        stepNumberInPage: 3,
        totalStepsInPage: 5,
        title: 'Personalization Questionnaire',
        description: 'Review your tailored daily productivity challenges and planning styles, or edit your preferences anytime.',
        targetSelector: '.clockit-card',
        route: '/app/settings',
        position: 'bottom',
      },
      {
        id: 'settings-guides',
        pageId: 'settings',
        pageTitle: 'Settings',
        stepNumberInPage: 4,
        totalStepsInPage: 5,
        title: 'Feature Guides & Tour Replay',
        description: 'Open the tutorial directory to replay individual modules or restart the complete product walkthrough.',
        targetSelector: '.clockit-card',
        route: '/app/settings',
        position: 'bottom',
      },
      {
        id: 'settings-finish',
        pageId: 'settings',
        pageTitle: 'Settings',
        stepNumberInPage: 5,
        totalStepsInPage: 5,
        title: "You're All Set!",
        description: "You have explored every major capability in ClockIt! You're ready to plan your days, run deep-work sessions, and build lasting habits.",
        tip: 'Press Finish to complete your tour. You can always replay guides from Settings!',
        targetSelector: '.clockit-page-container',
        route: '/app/settings',
        position: 'center',
      },
    ],
  },
];

/** Flattened array of all sequential tour steps across all 11 pages */
export const ALL_TOUR_STEPS: TourStep[] = TOUR_PAGES.flatMap((p) => p.steps);
export const TOTAL_TOUR_STEPS = ALL_TOUR_STEPS.length;
export const TOTAL_TOUR_PAGES = TOUR_PAGES.length;

// Aliases for backwards compatibility with earlier components
export type TutorialStep = TourStep;
export type TutorialModule = TourPage;
export const TUTORIAL_MODULES = TOUR_PAGES;

const ACTIVE_STEP_KEY = 'clockit-tour-active-step';
const TOUR_COMPLETED_KEY = 'clockit-tour-completed';
const DISMISSED_WELCOME_KEY = 'clockit-onboarding-welcome-dismissed';
const TUTORIAL_KEY_PREFIX = 'tutorial:';

export function getSavedTourStep(): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(ACTIVE_STEP_KEY);
  if (!raw) return 0;
  const num = parseInt(raw, 10);
  return isNaN(num) || num < 0 || num >= TOTAL_TOUR_STEPS ? 0 : num;
}

export function saveTourStep(stepIndex: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_STEP_KEY, String(stepIndex));
}

export function isGlobalTourCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  const keys = preferencesRepository.get('notificationReadKeys');
  if (keys.includes(`${TUTORIAL_KEY_PREFIX}global:completed`)) {
    return true;
  }
  return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
}

export function setGlobalTourCompleted(completed: boolean): void {
  if (typeof window === 'undefined') return;
  if (completed) {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    localStorage.removeItem(ACTIVE_STEP_KEY);
    const current = preferencesRepository.get('notificationReadKeys');
    const key = `${TUTORIAL_KEY_PREFIX}global:completed`;
    if (!current.includes(key)) {
      preferencesRepository.set('notificationReadKeys', [...current, key]);
    }
  } else {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    const current = preferencesRepository.get('notificationReadKeys');
    const filtered = current.filter((k) => k !== `${TUTORIAL_KEY_PREFIX}global:completed`);
    preferencesRepository.set('notificationReadKeys', filtered);
  }
}

export function getCompletedTutorialIds(): string[] {
  const keys = preferencesRepository.get('notificationReadKeys');
  return TOUR_PAGES.map((m) => m.id).filter((id) =>
    keys.includes(`${TUTORIAL_KEY_PREFIX}${id}:completed`),
  );
}

export function isTutorialCompleted(pageId: string): boolean {
  const keys = preferencesRepository.get('notificationReadKeys');
  return keys.includes(`${TUTORIAL_KEY_PREFIX}${pageId}:completed`);
}

export function completeTutorial(pageId: string): void {
  const current = preferencesRepository.get('notificationReadKeys');
  const targetKey = `${TUTORIAL_KEY_PREFIX}${pageId}:completed`;
  if (!current.includes(targetKey)) {
    preferencesRepository.set('notificationReadKeys', [...current, targetKey]);
  }
}

export function skipTutorial(pageId: string): void {
  const current = preferencesRepository.get('notificationReadKeys');
  const targetKey = `${TUTORIAL_KEY_PREFIX}${pageId}:skipped`;
  if (!current.includes(targetKey)) {
    preferencesRepository.set('notificationReadKeys', [...current, targetKey]);
  }
}

export function replayTutorial(pageId: string): void {
  const current = preferencesRepository.get('notificationReadKeys');
  const filtered = current.filter(
    (k) =>
      k !== `${TUTORIAL_KEY_PREFIX}${pageId}:completed` &&
      k !== `${TUTORIAL_KEY_PREFIX}${pageId}:skipped` &&
      k !== `${TUTORIAL_KEY_PREFIX}global:completed`,
  );
  preferencesRepository.set('notificationReadKeys', filtered);
  localStorage.removeItem(TOUR_COMPLETED_KEY);
}

export function resetAllTutorials(): void {
  const current = preferencesRepository.get('notificationReadKeys');
  const filtered = current.filter((k) => !k.startsWith(TUTORIAL_KEY_PREFIX));
  preferencesRepository.set('notificationReadKeys', filtered);
  localStorage.removeItem(ACTIVE_STEP_KEY);
  localStorage.removeItem(TOUR_COMPLETED_KEY);
  localStorage.removeItem(DISMISSED_WELCOME_KEY);
}

export function getTutorialProgress(): { completed: number; total: number; percentage: number } {
  const completed = getCompletedTutorialIds().length;
  const total = TOUR_PAGES.length;
  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

export function shouldShowInitialWelcome(): boolean {
  if (typeof window === 'undefined') return false;
  if (isGlobalTourCompleted()) return false;
  return !localStorage.getItem(DISMISSED_WELCOME_KEY);
}

export function dismissInitialWelcome(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DISMISSED_WELCOME_KEY, 'true');
}
