/**
 * Cross-tab synchronisation (Phase 11 §3).
 *
 * `localStorage` writes fire a `storage` event in every *other* tab, but
 * IndexedDB has no equivalent, so the two are paired: local-storage domains
 * ride the `storage` event, IndexedDB domains ride a `BroadcastChannel`.
 *
 * Two properties keep this loop-free and write-free:
 *  - a tab never receives its own notification (both APIs exclude the sender);
 *  - handling a notification only ever *reloads* state — it never writes back.
 */

/** Broadcast scope for the IndexedDB-backed notes database. */
export const NOTES_SCOPE = 'clockit-notes-db';

/** Synthetic key used when the whole store was cleared (`storage` event with a null key). */
const ALL_KEYS = '*';
const CHANNEL_NAME = 'clockit-sync';

type ChangeListener = (changedKeys: readonly string[]) => void;

const listeners = new Set<ChangeListener>();
let channel: BroadcastChannel | null = null;
let started = false;

function dispatch(changedKeys: readonly string[]): void {
  listeners.forEach((listener) => {
    try {
      listener(changedKeys);
    } catch (err) {
      console.error('[clockit/sync] change listener failed', err);
    }
  });
}

function start(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  window.addEventListener('storage', (event) => {
    dispatch(event.key === null ? [ALL_KEYS] : [event.key]);
  });

  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener('message', (event: MessageEvent) => {
      const scope = (event.data as { scope?: string } | null)?.scope;
      if (scope) dispatch([scope]);
    });
  }
}

export const crossTab = {
  /** Subscribes to changes made by *other* tabs. Starts the listeners on first use. */
  onChange(listener: ChangeListener): () => void {
    start();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Tells the other tabs that `scope` changed. Silent in this tab. */
  broadcast(scope: string): void {
    start();
    channel?.postMessage({ scope });
  },

  /** Whether a change set touches any of the keys a repository owns. */
  matches(changedKeys: readonly string[], keys: readonly string[]): boolean {
    if (changedKeys.includes(ALL_KEYS)) return true;
    return keys.some((key) => changedKeys.includes(key));
  },
};
