import type { CalendarEvent, TimelineEvent } from '../../data/mockData';
import { LocalJsonStore, ObservableRepository } from './storage';
import type { CalendarRepository } from './types';

const isEventArray = (value: unknown): value is CalendarEvent[] => Array.isArray(value);
const isTimelineArray = (value: unknown): value is TimelineEvent[] => Array.isArray(value);

/** Local-storage backed calendar repository (`clockit_calendar_events`, `clockit_timeline_events`). */
export class LocalCalendarRepository extends ObservableRepository implements CalendarRepository {
  readonly keys = ['clockit_calendar_events', 'clockit_timeline_events'];

  private readonly store = new LocalJsonStore<CalendarEvent[]>(
    'clockit_calendar_events',
    [],
    isEventArray,
  );

  private readonly timeline = new LocalJsonStore<TimelineEvent[]>(
    'clockit_timeline_events',
    [],
    isTimelineArray,
  );

  getEvents(): CalendarEvent[] {
    return [...this.store.value];
  }

  addEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const newEvent: CalendarEvent = { ...event, id: `ce-${Date.now()}` };
    this.store.save([...this.store.value, newEvent]);
    this.emit();
    return newEvent;
  }

  renameWorkspaceReferences(previousName: string, nextName: string): void {
    const next = this.store.value.map((event) =>
      event.workspace === previousName ? { ...event, workspace: nextName } : event,
    );
    if (next.some((event, index) => event !== this.store.value[index])) {
      this.store.save(next);
      this.emit();
    }
  }

  getTimelineEvents(): TimelineEvent[] {
    return [...this.timeline.value];
  }

  refreshFromStorage(): boolean {
    this.store.refresh();
    this.timeline.refresh();
    this.emit();
    return true;
  }
}
