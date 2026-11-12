import type { HabitItem } from '../../data/mockData';
import { LocalJsonStore, ObservableRepository } from './storage';
import type { HabitRepository } from './types';

const isHabitArray = (value: unknown): value is HabitItem[] => Array.isArray(value);

/** Local-storage backed habit repository (`clockit_habits`). */
export class LocalHabitRepository extends ObservableRepository implements HabitRepository {
  readonly keys = ['clockit_habits'];

  private readonly store = new LocalJsonStore<HabitItem[]>(
    'clockit_habits',
    [],
    isHabitArray,
  );

  getAll(): HabitItem[] {
    return [...this.store.value];
  }

  toggle(id: string): HabitItem[] {
    if (!id) return this.getAll();
    const next = this.store.value.map((habit) =>
      habit.id === id ? { ...habit, completed: !habit.completed } : habit,
    );
    this.store.save(next);
    this.emit();
    return this.getAll();
  }

  getCalendarDays() {
    // Historical habit activity is not currently persisted as individual
    // completion records, so never substitute demo history for real accounts.
    return [];
  }

  refreshFromStorage(): boolean {
    this.store.refresh();
    this.emit();
    return true;
  }
}
