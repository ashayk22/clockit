/**
 * Realistic sample data for ClockIt Demo Mode.
 *
 * This dataset is completely isolated in local volatile state and NEVER
 * synchronised to Supabase or mixed with real user data.
 */
import type {
  CalendarEvent,
  FocusSession,
  HabitItem,
  TaskItem,
  TimelineEvent,
  Workspace,
} from '../data/mockData';
import {
  CALENDAR_EVENTS,
  INITIAL_FOCUS_SESSIONS,
  INITIAL_HABITS,
  INITIAL_QUICK_NOTES,
  INITIAL_TASKS,
  INITIAL_WORKSPACES,
  TIMELINE_EVENTS,
} from '../data/mockData';

export const DEMO_USER_PROFILE = {
  id: 'usr_demo',
  name: 'Alex Chen',
  email: 'demo@clockit.app',
  isDemo: true,
};

export const DEMO_WORKSPACES: Workspace[] = [...INITIAL_WORKSPACES];

export const DEMO_TASKS: TaskItem[] = [...INITIAL_TASKS];

export const DEMO_FOCUS_SESSIONS: FocusSession[] = [...INITIAL_FOCUS_SESSIONS];

export const DEMO_HABITS: HabitItem[] = [...INITIAL_HABITS];

export const DEMO_CALENDAR_EVENTS: CalendarEvent[] = [...CALENDAR_EVENTS];

export const DEMO_TIMELINE_EVENTS: TimelineEvent[] = [...TIMELINE_EVENTS];

export const DEMO_QUICK_NOTES: string[] = [
  ...INITIAL_QUICK_NOTES,
  'Demo Tip: Click "Tasks" in the sidebar to view Kanban and list modes.',
  'Explore Focus Timer with audio soundscapes.',
];
