/**
 * Storage primitives shared by every local repository.
 *
 * Phase 11 §5 — storage failures are never swallowed:
 *  - a payload that cannot be parsed is left byte-for-byte on disk (it is
 *    never replaced by seed data), and the failure is reported;
 *  - a failed write is reported while the in-memory value is kept, so the UI
 *    stays usable and the user is told the change may not survive a reload.
 */
import type { Repository } from './types';

export type StorageIssueKind = 'unavailable' | 'corrupt' | 'write-failed';

export interface StorageIssue {
  kind: StorageIssueKind;
  key: string;
  message: string;
  at: number;
}

export class StorageError extends Error {
  readonly key: string;
  readonly cause?: unknown;
  constructor(message: string, key: string, cause?: unknown) {
    super(message);
    this.name = 'StorageError';
    this.key = key;
    this.cause = cause;
  }
}

export class CorruptStorageError extends StorageError {
  readonly raw: string;
  constructor(key: string, raw: string, cause?: unknown) {
    super(
      `Stored data for "${key}" is not valid JSON. The existing value was left untouched.`,
      key,
      cause,
    );
    this.name = 'CorruptStorageError';
    this.raw = raw;
  }
}

export class StorageWriteError extends StorageError {
  constructor(key: string, cause?: unknown) {
    super(
      `Could not write "${key}" to local storage. The change is kept in memory but may not survive a reload.`,
      key,
      cause,
    );
    this.name = 'StorageWriteError';
  }
}

const issueListeners = new Set<(issue: StorageIssue) => void>();
const recentIssues: StorageIssue[] = [];
const MAX_RECENT_ISSUES = 50;

/**
 * Records a storage problem once, in three places: the rolling history the UI
 * can read, any subscribed listener, and the console. Nothing is silent.
 */
function reportStorageIssue(kind: StorageIssueKind, key: string, message: string): void {
  const issue: StorageIssue = { kind, key, message, at: Date.now() };
  recentIssues.push(issue);
  if (recentIssues.length > MAX_RECENT_ISSUES) recentIssues.shift();
  console.error(`[clockit/storage] ${message}`);
  issueListeners.forEach((listener) => {
    try {
      listener(issue);
    } catch (err) {
      console.error('[clockit/storage] issue listener failed', err);
    }
  });
}

/** Read-only view of storage problems for the UI layer. */
export const storageIssues = {
  all(): StorageIssue[] {
    return [...recentIssues];
  },
  subscribe(listener: (issue: StorageIssue) => void): () => void {
    issueListeners.add(listener);
    return () => {
      issueListeners.delete(listener);
    };
  },
};

export type JsonRead<T> =
  | { status: 'ok'; value: T }
  | { status: 'empty' }
  | { status: 'corrupt'; raw: string; error: unknown };

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

/**
 * The only place in the app that touches `localStorage` directly.
 * Every read returns a discriminated result so callers can tell "absent" from
 * "unreadable" — which is what lets us avoid seeding over corrupt data.
 */
export const localStore = {
  readJson<T>(key: string): JsonRead<T> {
    if (!hasLocalStorage()) return { status: 'empty' };
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(key);
    } catch (error) {
      reportStorageIssue(
        'unavailable',
        key,
        `Local storage is unavailable; "${key}" fell back to its defaults.`,
      );
      return { status: 'empty' };
    }
    if (raw === null || raw === '') return { status: 'empty' };
    try {
      return { status: 'ok', value: JSON.parse(raw) as T };
    } catch (error) {
      reportStorageIssue('corrupt', key, new CorruptStorageError(key, raw, error).message);
      return { status: 'corrupt', raw, error };
    }
  },

  writeJson<T>(key: string, value: T): boolean {
    if (!hasLocalStorage()) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      reportStorageIssue('write-failed', key, new StorageWriteError(key, error).message);
      return false;
    }
  },

  readRaw(key: string): string | null {
    if (!hasLocalStorage()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      reportStorageIssue('unavailable', key, `Local storage is unavailable; "${key}" was ignored.`);
      return null;
    }
  },

  writeRaw(key: string, value: string): boolean {
    if (!hasLocalStorage()) return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      reportStorageIssue('write-failed', key, new StorageWriteError(key, error).message);
      return false;
    }
  },

  remove(key: string): void {
    if (!hasLocalStorage()) return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      reportStorageIssue('write-failed', key, new StorageWriteError(key, error).message);
    }
  },
};

/**
 * A JSON document kept in local storage.
 *
 * `save()` refuses to write while the key is quarantined (a payload we could
 * not parse), `refresh()` picks up another tab's write without ever writing
 * back — the combination is what makes corruption-safe storage possible.
 */
export class LocalJsonStore<T> {
  readonly key: string;
  private readonly fallback: T;
  private readonly guard?: (value: unknown) => value is T;
  private quarantined = false;
  value: T;

  constructor(key: string, fallback: T, guard?: (value: unknown) => value is T) {
    this.key = key;
    this.fallback = fallback;
    this.guard = guard;

    const result = localStore.readJson<T>(key);
    if (result.status === 'ok' && (!guard || guard(result.value))) {
      this.value = result.value;
      return;
    }
    if (result.status === 'ok') {
      reportStorageIssue(
        'corrupt',
        key,
        `Stored data for "${key}" has an unexpected shape. The existing value was left untouched.`,
      );
    }
    this.value = fallback;
    this.quarantined = result.status !== 'empty';
  }

  /** True when the stored payload was unreadable and must not be overwritten. */
  get isQuarantined(): boolean {
    return this.quarantined;
  }

  /** Replaces the in-memory value without touching storage (e.g. normalising on load). */
  hydrate(next: T): void {
    this.value = next;
  }

  /** Persists the value. Returns whether it actually reached storage. */
  save(next: T): boolean {
    this.value = next;
    if (this.quarantined) return false;
    return localStore.writeJson(this.key, next);
  }

  /** Picks up a write made by another tab. Never writes back, so no ping-pong. */
  refresh(): boolean {
    const result = localStore.readJson<T>(this.key);
    if (result.status === 'ok' && (!this.guard || this.guard(result.value))) {
      this.value = result.value;
      this.quarantined = false;
      return true;
    }
    if (result.status === 'empty') {
      this.value = this.fallback;
      this.quarantined = false;
      return true;
    }
    this.value = this.fallback;
    this.quarantined = true;
    return true;
  }
}

/** Base class for repositories: a listener list plus a change notification. */
export abstract class ObservableRepository implements Repository {
  abstract readonly keys: readonly string[];
  private readonly listeners = new Set<() => void>();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  protected emit(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in repository listener:', err);
      }
    });
  }

  abstract refreshFromStorage(): boolean;
}
