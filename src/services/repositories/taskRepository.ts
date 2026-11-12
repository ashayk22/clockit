import { INITIAL_TASKS, type TaskItem, type TaskPriority } from '../../data/mockData';
import {
  ANCHOR_DATE,
  WORKSPACE_COLORS,
  computeDaysDiff,
  formatDeadlineString,
} from '../taskUtils';
import { LocalJsonStore, ObservableRepository } from './storage';
import type { TaskRepository } from './types';

const isTaskArray = (value: unknown): value is TaskItem[] => Array.isArray(value);

/**
 * Turns a stored (possibly partial or legacy) payload into a complete task.
 * Moved here verbatim from `dataService` so the repository is the single owner
 * of the task shape.
 */
export function normalizeTask(raw: Partial<TaskItem>, index = 0): TaskItem {
  const status: TaskItem['status'] = raw.status || (raw.completed ? 'completed' : 'todo');
  const completed = status === 'completed' || Boolean(raw.completed);

  let daysLeft = raw.daysLeft || 'Upcoming';
  let isOverdue = Boolean(raw.isOverdue);
  let isToday = Boolean(raw.isToday);
  let deadline = raw.deadline || 'Upcoming';

  if (raw.dueDate) {
    const diff = computeDaysDiff(raw.dueDate);
    daysLeft = diff.daysLeft;
    isOverdue = diff.isOverdue && !completed;
    isToday = diff.isToday;
    deadline = formatDeadlineString(raw.dueDate, raw.dueTime);
  } else if (raw.deadline && raw.deadline.includes('overdue')) {
    isOverdue = !completed;
  }

  const workspace = raw.workspace || 'Personal';
  const categoryColor = raw.categoryColor || WORKSPACE_COLORS[workspace] || '#22c55e';

  return {
    id: raw.id || `task-${Date.now()}-${index}`,
    // Ownership is a pass-through slot: preserved when present, absent otherwise
    // (Phase 11 §4), so existing payloads round-trip unchanged.
    userId: raw.userId,
    title: raw.title || 'Untitled Task',
    description: raw.description || '',
    workspace,
    categoryColor,
    deadline,
    dueDate: raw.dueDate,
    dueTime: raw.dueTime,
    daysLeft,
    priority: (raw.priority as TaskPriority) || 'Medium',
    status,
    completed,
    estimate: raw.estimate || '1 hr',
    isToday,
    isOverdue,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    createdAt: raw.createdAt || Date.now() - index * 3600000,
    updatedAt: raw.updatedAt || Date.now(),
    focusMinutes: raw.focusMinutes || 0,
    focusSessionsCount: raw.focusSessionsCount || 0,
  };
}

/** Local-storage backed task repository (`clockit_tasks`). */
export class LocalTaskRepository extends ObservableRepository implements TaskRepository {
  readonly keys = ['clockit_tasks'];

  private readonly store = new LocalJsonStore<TaskItem[]>('clockit_tasks', INITIAL_TASKS, isTaskArray);

  constructor() {
    super();
    this.normalizeInPlace();
  }

  private normalizeInPlace(): void {
    const raw = Array.isArray(this.store.value) ? this.store.value : INITIAL_TASKS;
    this.store.hydrate(raw.map((task, index) => normalizeTask(task, index)));
  }

  getAll(): TaskItem[] {
    return [...this.store.value];
  }

  getById(id: string): TaskItem | undefined {
    if (!id) return undefined;
    return this.store.value.find((task) => task.id === id);
  }

  create(data: Partial<TaskItem>): TaskItem {
    const now = Date.now();
    const workspace = data.workspace || 'Personal';
    const categoryColor = data.categoryColor || WORKSPACE_COLORS[workspace] || '#22c55e';
    const priority = data.priority || 'Medium';
    const status = data.status || 'todo';
    const completed = status === 'completed';

    let daysLeft = data.daysLeft || 'Upcoming';
    let isOverdue = false;
    let isToday = Boolean(data.isToday);
    let deadline = data.deadline || 'Upcoming';

    if (data.dueDate) {
      const diff = computeDaysDiff(data.dueDate);
      daysLeft = diff.daysLeft;
      isOverdue = diff.isOverdue && !completed;
      isToday = diff.isToday || isToday;
      deadline = formatDeadlineString(data.dueDate, data.dueTime);
    }

    const newTask: TaskItem = {
      id: data.id || `task-${now}-${Math.random().toString(36).substring(2, 6)}`,
      // Ownership stays unset unless a caller supplies it — never fabricated.
      userId: data.userId,
      title: (data.title || 'Untitled Task').trim(),
      description: data.description?.trim() || '',
      workspace,
      categoryColor,
      deadline,
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      daysLeft,
      priority,
      status,
      completed,
      estimate: data.estimate || '1–2 hrs',
      isToday,
      isOverdue,
      tags: Array.isArray(data.tags) ? data.tags : [],
      createdAt: now,
      updatedAt: now,
      focusMinutes: 0,
      focusSessionsCount: 0,
    };

    this.commit([newTask, ...this.store.value]);
    return newTask;
  }

  update(id: string, updates: Partial<TaskItem>): TaskItem | undefined {
    const index = this.store.value.findIndex((t) => t.id === id);
    if (index === -1) return undefined;

    const existing = this.store.value[index];
    let status = updates.status !== undefined ? updates.status : existing.status;
    let completed = updates.completed !== undefined ? updates.completed : existing.completed;

    if (updates.status !== undefined && updates.completed === undefined) {
      completed = status === 'completed';
    } else if (updates.completed !== undefined && updates.status === undefined) {
      status = completed ? 'completed' : existing.status === 'completed' ? 'todo' : existing.status;
    }

    const dueDate = updates.dueDate !== undefined ? updates.dueDate : existing.dueDate;
    const dueTime = updates.dueTime !== undefined ? updates.dueTime : existing.dueTime;
    let deadline = updates.deadline !== undefined ? updates.deadline : existing.deadline;
    let daysLeft = updates.daysLeft !== undefined ? updates.daysLeft : existing.daysLeft;
    let isOverdue = updates.isOverdue !== undefined ? updates.isOverdue : existing.isOverdue;
    let isToday = updates.isToday !== undefined ? updates.isToday : existing.isToday;

    if (dueDate) {
      const diff = computeDaysDiff(dueDate);
      daysLeft = diff.daysLeft;
      isOverdue = diff.isOverdue && !completed;
      isToday = diff.isToday;
      deadline = formatDeadlineString(dueDate, dueTime);
    } else if (completed) {
      isOverdue = false;
    }

    const workspace = updates.workspace || existing.workspace;
    const categoryColor =
      updates.categoryColor || WORKSPACE_COLORS[workspace] || existing.categoryColor;

    const updated: TaskItem = {
      ...existing,
      ...updates,
      workspace,
      categoryColor,
      status,
      completed,
      dueDate,
      dueTime,
      deadline,
      daysLeft,
      isOverdue,
      isToday,
      updatedAt: Date.now(),
    };

    const next = [...this.store.value];
    next[index] = updated;
    this.commit(next);
    return updated;
  }

  toggle(id: string): TaskItem | undefined {
    const task = this.getById(id);
    if (!task) return undefined;
    const nextCompleted = !task.completed;
    return this.update(id, {
      completed: nextCompleted,
      status: nextCompleted ? 'completed' : 'todo',
    });
  }

  remove(id: string): void {
    if (!id) return;
    const next = this.store.value.filter((task) => task.id !== id);
    if (next.length === this.store.value.length) return;
    this.commit(next);
  }

  getToday(): TaskItem[] {
    return this.store.value.filter(
      (task) => task.isToday || task.daysLeft === 'Today' || task.dueDate === ANCHOR_DATE,
    );
  }

  refreshFromStorage(): boolean {
    this.store.refresh();
    this.normalizeInPlace();
    this.emit();
    return true;
  }

  private commit(next: TaskItem[]): void {
    this.store.save(next);
    this.emit();
  }
}
