import type { OwnedEntity } from './ownership';

/**
 * A workspace groups tasks and focus sessions.
 *
 * `description`, `icon` and `cover` are optional and were added after the
 * initial model, so all existing persisted workspaces round-trip without them.
 * Tasks still reference a workspace by its `name` (not `id`) — that legacy
 * link is preserved rather than migrated, to avoid breaking existing data.
 */
export interface Workspace extends OwnedEntity {
  id: string;
  name: string;
  color: string;
  description?: string;
  /** Lucide icon name used for the workspace mark. */
  icon?: string;
  /** Cover illustration key — maps to a built-in SVG cover. */
  cover?: string;
}

export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type TaskStatus = 'todo' | 'in-progress' | 'completed';

export interface TaskItem extends OwnedEntity {
  id: string;
  title: string;
  description?: string;
  workspace: string;
  categoryColor: string;
  deadline: string;
  dueDate?: string;
  dueTime?: string;
  daysLeft: string;
  priority: TaskPriority;
  status: TaskStatus;
  completed: boolean;
  estimate?: string;
  isToday?: boolean;
  isOverdue?: boolean;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  focusMinutes?: number;
  focusSessionsCount?: number;
}

export interface FocusSession extends OwnedEntity {
  id: string;
  taskId?: string | null;
  taskTitle?: string;
  mode: 'Deep Work' | 'Short Break' | 'Long Break';
  durationMinutes: number;
  completedAt: number;
}

export interface HabitItem extends OwnedEntity {
  id: string;
  title: string;
  time: string;
  duration?: string;
  iconName: 'sun' | 'dumbbell' | 'book' | 'laptop' | 'graduation-cap' | 'leaf' | 'smartphone' | 'file-text';
  completed: boolean;
  streak: number;
}

export interface HabitDayState {
  day: number;
  status: 'all' | 'partial' | 'missed' | 'minimal' | 'active';
}

export interface CalendarEvent extends OwnedEntity {
  id: string;
  day: number;
  title: string;
  time: string;
  workspace: string;
  color: string;
  tagColor: string;
}

export interface TimelineEvent extends OwnedEntity {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  color: string;
}

export interface GraphNode {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export const INITIAL_WORKSPACES: Workspace[] = [
  { id: 'personal', name: 'Personal', color: '#22c55e', description: 'Daily life, goals and routines', icon: 'Home', cover: 'personal' },
  { id: 'college', name: 'College', color: '#3b82f6', description: 'Academics, PBLs and submissions', icon: 'GraduationCap', cover: 'college' },
  { id: 'club', name: 'Club', color: '#a855f7', description: 'Finance, events and design work', icon: 'Users', cover: 'club' },
  { id: 'freelance', name: 'Freelance', color: '#f97316', description: 'Client work and projects', icon: 'Briefcase', cover: 'freelance' },
  { id: 'development', name: 'Development', color: '#10b981', description: 'Side projects, experiments and learning', icon: 'Code2', cover: 'development' },
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 't-1',
    title: 'PBL Final Report',
    description: 'Comprehensive documentation and final presentation deck for Problem Based Learning.',
    workspace: 'College',
    categoryColor: '#3b82f6',
    deadline: '1 Nov 2026',
    dueDate: '2026-11-01',
    dueTime: '10:00 AM',
    daysLeft: '6 days left',
    priority: 'Critical',
    status: 'in-progress',
    completed: false,
    estimate: '2–3 hrs',
    isToday: true,
    isOverdue: false,
    tags: ['#college', '#report', '#presentation'],
    createdAt: 1793000000000,
    updatedAt: 1793000000000,
  },
  {
    id: 't-2',
    title: 'Read CCN notes',
    description: 'Review Chapter 4 and 5 on packet switching and congestion control.',
    workspace: 'College',
    categoryColor: '#3b82f6',
    deadline: '3 Nov 2026',
    dueDate: '2026-11-03',
    dueTime: '02:00 PM',
    daysLeft: '8 days left',
    priority: 'High',
    status: 'todo',
    completed: false,
    estimate: '1 hr',
    isToday: true,
    isOverdue: false,
    tags: ['#study', '#networking'],
    createdAt: 1793001000000,
    updatedAt: 1793001000000,
  },
  {
    id: 't-3',
    title: 'UI ideas for ClockIt',
    description: 'Finalize dark mode palette, focus timer glow effect, and mobile breakpoints.',
    workspace: 'Personal',
    categoryColor: '#22c55e',
    deadline: '5 Nov 2026',
    dueDate: '2026-11-05',
    dueTime: '11:00 AM',
    daysLeft: '10 days left',
    priority: 'High',
    status: 'todo',
    completed: false,
    estimate: '2 hrs',
    isToday: true,
    isOverdue: false,
    tags: ['#design', '#clockit'],
    createdAt: 1793002000000,
    updatedAt: 1793002000000,
  },
  {
    id: 't-4',
    title: 'Financity Event Design',
    description: 'Banners, social media assets, and participant badges for club conference.',
    workspace: 'Club',
    categoryColor: '#a855f7',
    deadline: '10 Nov 2026',
    dueDate: '2026-11-10',
    dueTime: '05:00 PM',
    daysLeft: '15 days left',
    priority: 'Medium',
    status: 'todo',
    completed: false,
    estimate: '4 hrs',
    isToday: true,
    isOverdue: false,
    tags: ['#club', '#design', '#event'],
    createdAt: 1793003000000,
    updatedAt: 1793003000000,
  },
  {
    id: 't-5',
    title: 'BrandUp Client Website',
    description: 'Implement responsive hero layout and contact form integration.',
    workspace: 'Freelance',
    categoryColor: '#f97316',
    deadline: '12 Nov 2026',
    dueDate: '2026-11-12',
    dueTime: '03:00 PM',
    daysLeft: '17 days left',
    priority: 'Medium',
    status: 'todo',
    completed: false,
    estimate: '5 hrs',
    isToday: false,
    isOverdue: false,
    tags: ['#freelance', '#client', '#web'],
    createdAt: 1793004000000,
    updatedAt: 1793004000000,
  },
  {
    id: 't-6',
    title: 'Techverse Blog CMS',
    description: 'Configure Markdown MDX blog publishing pipeline.',
    workspace: 'Personal',
    categoryColor: '#22c55e',
    deadline: '20 Nov 2026',
    dueDate: '2026-11-20',
    dueTime: '01:00 PM',
    daysLeft: '25 days left',
    priority: 'Low',
    status: 'todo',
    completed: false,
    estimate: '2 hrs',
    isToday: false,
    isOverdue: false,
    tags: ['#personal', '#blog'],
    createdAt: 1793005000000,
    updatedAt: 1793005000000,
  },
  {
    id: 't-7',
    title: 'SIH Documentation',
    description: 'System architecture diagrams and patent literature survey for Smart India Hackathon.',
    workspace: 'SIH',
    categoryColor: '#10b981',
    deadline: '28 Nov 2026',
    dueDate: '2026-11-28',
    dueTime: '11:00 AM',
    daysLeft: '33 days left',
    priority: 'Low',
    status: 'todo',
    completed: false,
    estimate: '1.5 hrs',
    isToday: false,
    isOverdue: false,
    tags: ['#hackathon', '#sih'],
    createdAt: 1793006000000,
    updatedAt: 1793006000000,
  },
  {
    id: 't-8',
    title: 'Deploy New Update',
    description: 'Deploy hotfix v1.0.4 for task state sync and theme transitions.',
    workspace: 'Development',
    categoryColor: '#10b981',
    deadline: '24 Oct 2026',
    dueDate: '2026-10-24',
    dueTime: '02:00 PM',
    daysLeft: '2 days overdue',
    priority: 'High',
    status: 'todo',
    completed: false,
    estimate: '1 hr',
    isToday: false,
    isOverdue: true,
    tags: ['#dev', '#release', '#deploy'],
    createdAt: 1792900000000,
    updatedAt: 1792900000000,
  },
  {
    id: 't-9',
    title: 'Draft Architecture Spec',
    description: 'Write specifications for IndexedDB offline persistence and state store.',
    workspace: 'Development',
    categoryColor: '#10b981',
    deadline: '20 Oct 2026',
    dueDate: '2026-10-20',
    daysLeft: 'Completed',
    priority: 'Medium',
    status: 'completed',
    completed: true,
    estimate: '3 hrs',
    isToday: false,
    isOverdue: false,
    tags: ['#architecture', '#spec'],
    createdAt: 1792800000000,
    updatedAt: 1792850000000,
  },
  {
    id: 't-10',
    title: 'Wireframe Review',
    description: 'Feedback session on multi-column Notes and Habit calendar.',
    workspace: 'Personal',
    categoryColor: '#22c55e',
    deadline: '18 Oct 2026',
    dueDate: '2026-10-18',
    daysLeft: 'Completed',
    priority: 'Low',
    status: 'completed',
    completed: true,
    estimate: '1 hr',
    isToday: false,
    isOverdue: false,
    tags: ['#ui', '#review'],
    createdAt: 1792700000000,
    updatedAt: 1792750000000,
  },
  {
    id: 't-11',
    title: 'Update Readme & Notes',
    description: 'Document local developer setup and testing workflows.',
    workspace: 'Personal',
    categoryColor: '#22c55e',
    deadline: '15 Oct 2026',
    dueDate: '2026-10-15',
    daysLeft: 'Completed',
    priority: 'Low',
    status: 'completed',
    completed: true,
    estimate: '45 mins',
    isToday: false,
    isOverdue: false,
    tags: ['#docs'],
    createdAt: 1792600000000,
    updatedAt: 1792650000000,
  },
];

export const INITIAL_TODAY_TASKS = [
  { id: 'td-1', title: 'PBL Final Report', color: '#ef4444', deadline: '1 Nov', priority: 'Critical' as const, completed: false },
  { id: 'td-2', title: 'Read CCN notes', color: '#3b82f6', deadline: '3 Nov', priority: 'High' as const, completed: false },
  { id: 'td-3', title: 'UI ideas for ClockIt', color: '#22c55e', deadline: '5 Nov', priority: 'High' as const, completed: false },
  { id: 'td-4', title: 'Financity Event Design', color: '#a855f7', deadline: '10 Nov', priority: 'Medium' as const, completed: false },
];

/**
 * Seed focus sessions for the design anchor day. Every focus figure in the app
 * is derived from these records — the data layer never hard-codes statistics.
 */
export const INITIAL_FOCUS_SESSIONS: FocusSession[] = [
  { id: 'fs-seed-1', taskId: null, taskTitle: 'Morning planning', mode: 'Short Break', durationMinutes: 15, completedAt: new Date('2026-10-26T08:45:00').getTime() },
  { id: 'fs-seed-2', taskId: null, taskTitle: 'Deep work block', mode: 'Deep Work', durationMinutes: 45, completedAt: new Date('2026-10-26T09:30:00').getTime() },
  { id: 'fs-seed-3', taskId: null, taskTitle: 'Deep work block', mode: 'Deep Work', durationMinutes: 45, completedAt: new Date('2026-10-26T10:30:00').getTime() },
  { id: 'fs-seed-4', taskId: null, taskTitle: 'Midday reset', mode: 'Long Break', durationMinutes: 20, completedAt: new Date('2026-10-26T11:00:00').getTime() },
  { id: 'fs-seed-5', taskId: null, taskTitle: 'Afternoon focus', mode: 'Deep Work', durationMinutes: 30, completedAt: new Date('2026-10-26T14:00:00').getTime() },
];

export const INITIAL_HABITS: HabitItem[] = [
  { id: 'h-1', title: 'Wake up early', time: '6:00 AM', iconName: 'sun', completed: true, streak: 12 },
  { id: 'h-2', title: 'Morning workout', time: '6:30 AM · 30 min', iconName: 'dumbbell', completed: true, streak: 15 },
  { id: 'h-3', title: 'Read', time: '20 min', iconName: 'book', completed: true, streak: 28 },
  { id: 'h-4', title: 'Code / Work on project', time: '2 hours', iconName: 'laptop', completed: false, streak: 6 },
  { id: 'h-5', title: 'Learn something new', time: '30 min', iconName: 'graduation-cap', completed: true, streak: 7 },
  { id: 'h-6', title: 'Meditate', time: '10 min', iconName: 'leaf', completed: false, streak: 8 },
  { id: 'h-7', title: 'No social media', time: 'All day', iconName: 'smartphone', completed: true, streak: 12 },
  { id: 'h-8', title: 'Plan tomorrow', time: '5 min', iconName: 'file-text', completed: false, streak: 5 },
];

export const HABIT_CALENDAR_DAYS: HabitDayState[] = [
  { day: 1, status: 'all' },
  { day: 2, status: 'all' },
  { day: 3, status: 'all' },
  { day: 4, status: 'all' },
  { day: 5, status: 'all' },
  { day: 6, status: 'all' },
  { day: 7, status: 'all' },
  { day: 8, status: 'missed' },
  { day: 9, status: 'partial' },
  { day: 10, status: 'all' },
  { day: 11, status: 'missed' },
  { day: 12, status: 'all' },
  { day: 13, status: 'all' },
  { day: 14, status: 'minimal' },
  { day: 15, status: 'partial' },
  { day: 16, status: 'all' },
  { day: 17, status: 'missed' },
  { day: 18, status: 'all' },
  { day: 19, status: 'all' },
  { day: 20, status: 'all' },
  { day: 21, status: 'partial' },
  { day: 22, status: 'missed' },
  { day: 23, status: 'all' },
  { day: 24, status: 'all' },
  { day: 25, status: 'minimal' },
  { day: 26, status: 'active' },
  { day: 27, status: 'all' },
  { day: 28, status: 'all' },
  { day: 29, status: 'missed' },
  { day: 30, status: 'all' },
  { day: 31, status: 'all' },
];

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'ce-1', day: 1, title: 'PBL Final Report', time: '10:00 AM', workspace: 'College', color: '#22c55e', tagColor: 'rgba(34, 197, 94, 0.15)' },
  { id: 'ce-2', day: 3, title: 'Read CCN notes', time: '2:00 PM', workspace: 'College', color: '#f59e0b', tagColor: 'rgba(245, 158, 11, 0.15)' },
  { id: 'ce-3', day: 5, title: 'UI ideas for ClockIt', time: '11:00 AM', workspace: 'Personal', color: '#3b82f6', tagColor: 'rgba(59, 130, 246, 0.15)' },
  { id: 'ce-4', day: 8, title: 'Workout', time: '7:00 AM', workspace: 'Habits', color: '#ef4444', tagColor: 'rgba(239, 68, 68, 0.15)' },
  { id: 'ce-5', day: 8, title: 'Project Discussion', time: '4:00 PM', workspace: 'Development', color: '#8b5cf6', tagColor: 'rgba(139, 92, 246, 0.15)' },
  { id: 'ce-6', day: 10, title: 'Financity Event', time: '5:00 PM', workspace: 'Club', color: '#8b5cf6', tagColor: 'rgba(139, 92, 246, 0.15)' },
  { id: 'ce-7', day: 12, title: 'BrandUp Client Call', time: '3:00 PM', workspace: 'Freelance', color: '#f97316', tagColor: 'rgba(249, 115, 22, 0.15)' },
  { id: 'ce-8', day: 14, title: 'Techverse Blog', time: '1:00 PM', workspace: 'Personal', color: '#3b82f6', tagColor: 'rgba(59, 130, 246, 0.15)' },
  { id: 'ce-9', day: 18, title: 'Design Review', time: '4:00 PM', workspace: 'Personal', color: '#ef4444', tagColor: 'rgba(239, 68, 68, 0.15)' },
  { id: 'ce-10', day: 21, title: 'SIH Documentation', time: '11:00 AM', workspace: 'College', color: '#22c55e', tagColor: 'rgba(34, 197, 94, 0.15)' },
  { id: 'ce-11', day: 24, title: 'Plan Next Week', time: '6:00 PM', workspace: 'Habits', color: '#f59e0b', tagColor: 'rgba(245, 158, 11, 0.15)' },
  { id: 'ce-12', day: 26, title: 'Deploy New Update', time: '2:00 PM', workspace: 'Development', color: '#8b5cf6', tagColor: 'rgba(139, 92, 246, 0.15)' },
];

export const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: 'tl-1', time: '8:00 AM', title: 'Morning workout', subtitle: 'Gym · 1h', color: '#22c55e' },
  { id: 'tl-2', time: '10:00 AM', title: 'PBL Final Report', subtitle: 'College · 2h', color: '#3b82f6' },
  { id: 'tl-3', time: '1:00 PM', title: 'Lunch Break', subtitle: '1h', color: '#6b7280' },
  { id: 'tl-4', time: '2:00 PM', title: 'Deploy New Update', subtitle: 'Development · 2h', color: '#8b5cf6' },
  { id: 'tl-5', time: '5:00 PM', title: 'Read CCN notes', subtitle: 'College · 1h', color: '#f59e0b' },
  { id: 'tl-6', time: '7:00 PM', title: 'Personal Project', subtitle: 'Development · 2h', color: '#ef4444' },
];

export const KNOWLEDGE_GRAPH_NODES: GraphNode[] = [
  { id: 'clockit', label: 'ClockIt', color: '#22c55e', x: 190, y: 140 },
  { id: 'features', label: 'Features', color: '#8b5cf6', x: 190, y: 50 },
  { id: 'techstack', label: 'Tech Stack', color: '#3b82f6', x: 290, y: 90 },
  { id: 'tasks', label: 'Tasks', color: '#ef4444', x: 290, y: 190 },
  { id: 'futureideas', label: 'Future Ideas', color: '#f59e0b', x: 190, y: 230 },
  { id: 'development', label: 'Development', color: '#10b981', x: 90, y: 190 },
  { id: 'uiideas', label: 'UI Ideas', color: '#a855f7', x: 90, y: 90 },
];

export const KNOWLEDGE_GRAPH_LINKS: GraphLink[] = [
  { source: 'clockit', target: 'features' },
  { source: 'clockit', target: 'techstack' },
  { source: 'clockit', target: 'tasks' },
  { source: 'clockit', target: 'futureideas' },
  { source: 'clockit', target: 'development' },
  { source: 'clockit', target: 'uiideas' },
];

export const INITIAL_QUICK_NOTES = [
  'Jot down a thought...',
  'Remember to submit PBL report by Friday',
  'Test ClockIt responsive layout on tablet',
];
