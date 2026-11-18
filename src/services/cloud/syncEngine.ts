/**
 * Local-first cloud sync (Phase 12 & Phase 13.2 Core Reliability).
 *
 * The UI reads its data synchronously from the existing local repositories, so
 * the cloud layer is deliberately *additive* rather than a rewrite:
 *
 *   sign in  ──▶  hydrate(): pull this user's rows and write them into the very
 *                 storage the repositories already read from (preserving any unpushed offline edits)
 *   edit     ──▶  the local repository writes as it always has; we observe the
 *                 change, diff it against our last snapshot and queue the
 *                 matching Supabase upsert / delete
 *   offline  ──▶  the queue is persisted and replayed when the browser is back
 *                 online, so nothing is lost and no UI code had to change
 *
 * Phase 13.2 Hardening:
 *  - Atomic Quick Notes replacement via Postgres RPC `clockit_replace_quick_notes`
 *    with a safe upsert-first fallback to prevent data loss on network drops.
 *  - Explicit synchronization state ('idle' | 'syncing' | 'synced' | 'error' | 'offline').
 *  - Observable sync status with automatic recovery and user retry notifications.
 *  - Protection of unsynchronized local changes during hydration.
 */
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { dataService } from '../dataService';
import { noteRepository, preferencesRepository, setRepositoryOwner } from '../repositories';
import { localStore, scopedStorageKey } from '../repositories/storage';
import { toast } from '../../components/ui/NotificationToast';
import { TABLES, entityDomains, type CloudEntity, type Row } from './mappers';

export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface CloudSyncState {
  status: CloudSyncStatus;
  lastSyncedAt: number | null;
  errorMessage: string | null;
  pendingCount: number;
}

type UnownedSyncOp =
  | { kind: 'upsert'; table: string; conflict: string; clientId: string; payload: Row }
  | { kind: 'delete'; table: string; clientId: string }
  | { kind: 'replace-quick-notes'; notes: string[] };
type SyncOp = UnownedSyncOp & { ownerId: string };

const LEGACY_QUEUE_KEY = 'clockit-sync-queue';
const queueKey = (owner: string) => `clockit-sync-queue:${encodeURIComponent(owner)}`;
const SNAPSHOTS_KEY = 'clockit-sync-snapshots';
const DIRTY_KEY = 'clockit-sync-local-dirty';
const SCAN_DEBOUNCE_MS = 200;

let userId: string | null = null;
let started = false;
let applying = false;
let unsub: (() => void) | null = null;
let scanTimer: number | null = null;
let flushTimer: number | null = null;
let flushing = false;

const snapshots = new Map<string, string>();
let queue: SyncOp[] = [];

// ------------------------------------------------------------------ state management
type SyncStateListener = (state: CloudSyncState) => void;
const syncStateListeners = new Set<SyncStateListener>();

let syncState: CloudSyncState = {
  status: 'idle',
  lastSyncedAt: null,
  errorMessage: null,
  pendingCount: 0,
};

function updateSyncState(patch: Partial<CloudSyncState>): void {
  syncState = { ...syncState, ...patch, pendingCount: queue.length };
  syncStateListeners.forEach((listener) => {
    try {
      listener(syncState);
    } catch (e) {
      console.error('[clockit/sync] syncState listener error', e);
    }
  });
}

export function getSyncState(): CloudSyncState {
  return { ...syncState, pendingCount: queue.length };
}

export function subscribeToSyncState(listener: SyncStateListener): () => void {
  syncStateListeners.add(listener);
  listener(getSyncState());
  return () => {
    syncStateListeners.delete(listener);
  };
}

function report(message: string, error?: unknown): void {
  console.error(`[clockit/cloud] ${message}`, error ?? '');
}

const ownerKey = (key: string, uid: string) => scopedStorageKey(key, `user:${uid}`);
const hasDirtyLocalState = (uid: string): boolean => {
  const result = localStore.readJson<boolean>(ownerKey(DIRTY_KEY, uid));
  return result.status === 'ok' && result.value === true;
};

/** Marks an owner-scoped local write so hydration preserves it until scanned. */
export function markOwnerLocalChange(uid: string): void {
  if (uid) localStore.writeJson(ownerKey(DIRTY_KEY, uid), true);
}

function persistSnapshots(uid: string): void {
  localStore.writeJson(ownerKey(SNAPSHOTS_KEY, uid), Object.fromEntries(snapshots));
}

function loadSnapshots(uid: string): void {
  const saved = localStore.readJson<Record<string, string>>(ownerKey(SNAPSHOTS_KEY, uid));
  if (saved.status === 'ok' && saved.value && typeof saved.value === 'object') {
    for (const [table, value] of Object.entries(saved.value)) {
      if (typeof value === 'string') snapshots.set(table, value);
    }
  }
}

// ------------------------------------------------------------------ queue io
function persistQueue(): void {
  try {
    if (!userId) return;
    localStore.writeJson(queueKey(userId), { userId, ops: queue });
    updateSyncState({ pendingCount: queue.length });
  } catch (error) {
    report('Could not persist the sync queue', error);
  }
}

function loadQueue(forUser: string): void {
  const stored = localStore.readJson<{ userId: string | null; ops: SyncOp[] }>(queueKey(forUser));
  if (stored.status === 'ok' && stored.value && stored.value.userId !== forUser) {
    const quarantineKey = `clockit-sync-queue-quarantine:${encodeURIComponent(forUser)}:${Date.now()}`;
    if (!localStore.writeJson(quarantineKey, stored.value)) {
      queue = [];
      report('Queue owner mismatch found; original queue retained because quarantine storage failed.');
      return;
    }
  }
  const rejected = stored.status === 'ok' && stored.value?.userId === forUser && Array.isArray(stored.value.ops)
    ? stored.value.ops.filter((op) => !op || op.ownerId !== forUser)
    : [];
  if (stored.status === 'ok' && rejected.length > 0) {
    const quarantineKey = `clockit-sync-queue-quarantine:${encodeURIComponent(forUser)}:${Date.now()}`;
    if (!localStore.writeJson(quarantineKey, stored.value)) {
      queue = [];
      report('Queue ownership mismatch found; original queue retained because quarantine storage failed.');
      return;
    }
  }
  let ops = stored.status === 'ok' && stored.value?.userId === forUser && Array.isArray(stored.value.ops)
    ? stored.value.ops.filter((op) => op && op.ownerId === forUser)
    : [];
  // Safely adopt the legacy single-owner queue only for its recorded owner; leave its original bytes intact.
  if (ops.length === 0) {
    const legacy = localStore.readJson<{ userId: string | null; ops: SyncOp[] }>(LEGACY_QUEUE_KEY);
    if (legacy.status === 'ok' && legacy.value?.userId === forUser && Array.isArray(legacy.value.ops)) {
      ops = legacy.value.ops.map((op) => ({ ...op, ownerId: forUser }));
    }
  }
  queue = ops;
  persistQueue();
  updateSyncState({ pendingCount: queue.length });
}

const opKey = (op: SyncOp): string =>
  op.kind === 'replace-quick-notes' ? 'quick_notes:*' : `${op.table}:${op.clientId}`;

function enqueue(op: UnownedSyncOp): void {
  if (!userId) return;
  const ownedOp: SyncOp = { ...op, ownerId: userId } as SyncOp;
  const key = opKey(ownedOp);
  const existing = queue.findIndex((candidate) => opKey(candidate) === key);
  if (existing !== -1) queue.splice(existing, 1);
  queue.push(ownedOp);
  persistQueue();
}

// ------------------------------------------------------------------ flush & atomic apply
async function applyOp(op: SyncOp, owner: string): Promise<void> {
  if (!supabase || !owner || userId !== owner || op.ownerId !== owner) return;

  if (op.kind === 'upsert') {
    if (op.payload.user_id !== owner) throw new Error('Queued operation owner does not match active account.');
    let { error } = await supabase.from(op.table).upsert(op.payload, { onConflict: op.conflict });
    if (error && op.table === TABLES.userPreferences) {
      // If table has not yet executed migration 0002, gracefully fall back to base columns
      const basePayload: Row = {
        user_id: op.payload.user_id,
        theme: op.payload.theme,
        sidebar_collapsed: op.payload.sidebar_collapsed,
        notification_read_keys: op.payload.notification_read_keys,
        active_workspace_id: op.payload.active_workspace_id,
      };
      const retry = await supabase.from(op.table).upsert(basePayload, { onConflict: op.conflict });
      if (!retry.error) {
        error = null;
      }
    }
    if (error) throw error;
    return;
  }

  if (op.kind === 'delete') {
    const { error } = await supabase
      .from(op.table)
      .delete()
      .eq('user_id', owner)
      .eq('client_id', op.clientId);
    if (error) throw error;
    return;
  }

  // replace-quick-notes (Phase 13.2 Atomic Implementation):
  if (op.kind === 'replace-quick-notes') {
    const notePayload = op.notes.map((body, index) => ({
      body,
      client_id: `qn-${index}-${body.length}-${body.slice(0, 16)}`,
      sort_index: index,
    }));

    // Step 1: Attempt transactional Postgres RPC function (Migration 0003)
    let rpcSuccess = false;
    try {
      const { error: rpcError } = await supabase.rpc('clockit_replace_quick_notes', {
        p_notes: notePayload,
      });
      if (!rpcError) {
        rpcSuccess = true;
      }
    } catch {
      rpcSuccess = false;
    }

    if (rpcSuccess) return;

    // Step 2: Safe Upsert-First Fallback if RPC is not installed:
    // We upsert all new rows FIRST before trimming old surplus indices.
    // This strictly eliminates the risk of an empty cloud state if network drops.
    if (op.notes.length > 0) {
      const rows = op.notes.map((body, index) => ({
        user_id: owner,
        client_id: `qn-${index}`,
        body,
        sort_index: index,
      }));
      const { error: upsertErr } = await supabase
        .from(TABLES.quickNotes)
        .upsert(rows, { onConflict: 'user_id,client_id' });
      if (upsertErr) throw upsertErr;
    }

    // After new rows are verified in the cloud, trim any old surplus records
    const { error: trimErr } = await supabase
      .from(TABLES.quickNotes)
      .delete()
      .eq('user_id', owner)
      .gte('sort_index', op.notes.length);
    if (trimErr) throw trimErr;
  }
}

async function flush(): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId || flushing) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    updateSyncState({ status: 'offline' });
    return;
  }

  flushing = true;
  const owner = userId;
  const ownerQueue = queue;
  updateSyncState({ status: 'syncing' });

  try {
    while (userId === owner && queue === ownerQueue && ownerQueue.length > 0) {
      const op = ownerQueue[0];
      try {
        await applyOp(op, owner);
        if (userId !== owner || queue !== ownerQueue) break;
        if (ownerQueue[0] === op) ownerQueue.shift();
        persistQueue();
      } catch (error) {
        if (userId !== owner || queue !== ownerQueue) break;
        report('A queued change could not be pushed; it will be retried', error);
        updateSyncState({
          status: 'error',
          errorMessage: 'Unsynced changes queued for retry.',
        });
        break; // keep order and retry on the next trigger
      }
    }
    if (userId === owner && queue === ownerQueue && ownerQueue.length === 0) {
      updateSyncState({
        status: 'synced',
        lastSyncedAt: Date.now(),
        errorMessage: null,
      });
    }
  } finally {
    flushing = false;
    if (queue.length && userId && userId !== owner) scheduleFlush();
  }
}

function scheduleFlush(): void {
  if (flushTimer !== null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flush();
  }, 300);
}

// ------------------------------------------------------------------ scanning
function entitySignature(records: readonly CloudEntity[]): string {
  const map: Record<string, string> = {};
  for (const record of records) map[record.id] = JSON.stringify(record);
  return JSON.stringify(map);
}

function preferencesRow(uid: string): Row {
  const prefs = preferencesRepository.getAll();
  const notifKeys = [...prefs.notificationReadKeys];
  if (prefs.onboardingCompleted && !notifKeys.includes('onboarding:completed')) {
    notifKeys.push('onboarding:completed');
  }
  if (prefs.planningPreference && !notifKeys.some((k) => k.startsWith('onboarding:planning:'))) {
    notifKeys.push(`onboarding:planning:${encodeURIComponent(prefs.planningPreference)}`);
  }
  if (prefs.preferredFocusDuration && !notifKeys.some((k) => k.startsWith('onboarding:focus:'))) {
    notifKeys.push(`onboarding:focus:${prefs.preferredFocusDuration}`);
  }
  if (prefs.appearancePreference && !notifKeys.some((k) => k.startsWith('onboarding:appearance:'))) {
    notifKeys.push(`onboarding:appearance:${prefs.appearancePreference}`);
  }

  return {
    user_id: uid,
    theme: prefs.theme,
    sidebar_collapsed: prefs.sidebarCollapsed,
    notification_read_keys: notifKeys,
    active_workspace_id: prefs.activeWorkspaceId,
    onboarding_completed: prefs.onboardingCompleted,
    productivity_challenges: prefs.productivityChallenges,
    planning_preference: prefs.planningPreference,
    preferred_focus_duration: prefs.preferredFocusDuration,
    appearance_preference: prefs.appearancePreference,
  };
}

async function scan(): Promise<void> {
  if (!userId || !supabase) return;
  const uid = userId;

  for (const domain of entityDomains) {
    const records = await domain.readLocal();
    if (userId !== uid) return;
    const previousRaw = snapshots.get(domain.table);
    const previous: Record<string, string> = previousRaw ? safeParse(previousRaw) : {};
    const next: Record<string, string> = {};

    for (const record of records) {
      const json = JSON.stringify(record);
      next[record.id] = json;
      if (previous[record.id] !== json) {
        enqueue({
          kind: 'upsert',
          table: domain.table,
          conflict: 'user_id,client_id',
          clientId: record.id,
          payload: domain.toRow(record, uid),
        });
      }
    }
    for (const id of Object.keys(previous)) {
      if (!(id in next)) enqueue({ kind: 'delete', table: domain.table, clientId: id });
    }
    snapshots.set(domain.table, JSON.stringify(next));
  }

  const prefsJson = JSON.stringify(preferencesRepository.getAll());
  if (userId !== uid) return;
  if (snapshots.get(TABLES.userPreferences) !== prefsJson) {
    snapshots.set(TABLES.userPreferences, prefsJson);
    enqueue({
      kind: 'upsert',
      table: TABLES.userPreferences,
      conflict: 'user_id',
      clientId: uid,
      payload: preferencesRow(uid),
    });
  }

  const quickNotes = noteRepository.getQuickNotes();
  const quickJson = JSON.stringify(quickNotes);
  if (snapshots.get(TABLES.quickNotes) !== quickJson) {
    snapshots.set(TABLES.quickNotes, quickJson);
    enqueue({ kind: 'replace-quick-notes', notes: quickNotes });
  }

  persistSnapshots(uid);
  localStore.remove(ownerKey(DIRTY_KEY, uid));
  void flush();
}

function safeParse(json: string): Record<string, string> {
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function scheduleScan(): void {
  if (!started || applying || userId === null) return;
  localStore.writeJson(ownerKey(DIRTY_KEY, userId), true);
  if (scanTimer !== null) return;
  scanTimer = window.setTimeout(() => {
    scanTimer = null;
    void scan();
  }, SCAN_DEBOUNCE_MS);
}

// ---------------------------------------------------------------- hydration
async function hydratePreferences(): Promise<void> {
  if (!supabase || !userId) return;
  const uid = userId;
  if (hasDirtyLocalState(uid)) return;
  const { data, error } = await supabase
    .from(TABLES.userPreferences)
    .select('*')
    .eq('user_id', uid)
    .maybeSingle();
  if (userId !== uid) return;

  if (error) {
    report('Could not load user preferences', error);
  } else if (data) {
    if ((data as Row).user_id !== uid) return;
    const row = data as Row;
    const notifKeys = Array.isArray(row.notification_read_keys) ? (row.notification_read_keys as string[]) : [];
    preferencesRepository.set('theme', row.theme === 'dark' ? 'dark' : 'light');
    preferencesRepository.set('sidebarCollapsed', Boolean(row.sidebar_collapsed));
    preferencesRepository.set('notificationReadKeys', notifKeys);
    preferencesRepository.set(
      'activeWorkspaceId',
      typeof row.active_workspace_id === 'string' ? row.active_workspace_id : null,
    );

    let onboardingCompleted = typeof row.onboarding_completed === 'boolean' ? row.onboarding_completed : false;
    if (!onboardingCompleted && notifKeys.includes('onboarding:completed')) {
      onboardingCompleted = true;
    }
    preferencesRepository.set('onboardingCompleted', onboardingCompleted);

    if (Array.isArray(row.productivity_challenges) && row.productivity_challenges.length > 0) {
      preferencesRepository.set('productivityChallenges', row.productivity_challenges as string[]);
    }

    let planningPref = typeof row.planning_preference === 'string' ? row.planning_preference : null;
    if (!planningPref) {
      const found = notifKeys.find((k) => k.startsWith('onboarding:planning:'));
      if (found) planningPref = decodeURIComponent(found.slice('onboarding:planning:'.length));
    }
    if (planningPref) preferencesRepository.set('planningPreference', planningPref);

    let focusDur = typeof row.preferred_focus_duration === 'number' ? row.preferred_focus_duration : 0;
    if (!focusDur) {
      const found = notifKeys.find((k) => k.startsWith('onboarding:focus:'));
      if (found) focusDur = parseInt(found.slice('onboarding:focus:'.length), 10);
    }
    if (focusDur > 0) preferencesRepository.set('preferredFocusDuration', focusDur);

    let appearancePref = typeof row.appearance_preference === 'string' ? (row.appearance_preference as any) : null;
    if (!appearancePref) {
      const found = notifKeys.find((k) => k.startsWith('onboarding:appearance:'));
      if (found) appearancePref = found.slice('onboarding:appearance:'.length) as any;
    }
    if (appearancePref) preferencesRepository.set('appearancePreference', appearancePref);
  } else {
    enqueue({
      kind: 'upsert',
      table: TABLES.userPreferences,
      conflict: 'user_id',
      clientId: uid,
      payload: preferencesRow(uid),
    });
  }
  snapshots.set(TABLES.userPreferences, JSON.stringify(preferencesRepository.getAll()));
}

async function hydrateQuickNotes(): Promise<void> {
  if (!supabase || !userId) return;
  const uid = userId;
  if (hasDirtyLocalState(uid)) return;

  // If there are unpushed quick note edits queued locally, preserve them
  const hasPendingQuickNotes = queue.some((op) => op.ownerId === uid && op.kind === 'replace-quick-notes');
  if (hasPendingQuickNotes) {
    snapshots.set(TABLES.quickNotes, JSON.stringify(noteRepository.getQuickNotes()));
    return;
  }

  const { data, error } = await supabase
    .from(TABLES.quickNotes)
    .select('user_id, body, sort_index')
    .eq('user_id', uid)
    .order('sort_index', { ascending: true });
  if (userId !== uid) return;

  if (error) {
    report('Could not load quick notes', error);
  } else if (Array.isArray(data) && data.length > 0) {
    const list = data
      .filter((row) => (row as Row).user_id === uid)
      .map((row) => String((row as Row).body ?? ''));
    localStore.writeJson(scopedStorageKey('clockit_quick_notes', `user:${uid}`), list);
    noteRepository.refreshFromStorage();
  }
  snapshots.set(TABLES.quickNotes, JSON.stringify(noteRepository.getQuickNotes()));
}

async function hydrate(): Promise<void> {
  if (!supabase || !userId) return;
  const uid = userId;
  applying = true;
  updateSyncState({ status: 'syncing', errorMessage: null });

  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      updateSyncState({ status: 'offline', errorMessage: 'Working offline' });
      return;
    }

    for (const domain of entityDomains) {
      // Check if user has offline changes pending in queue for this table.
      // If yes, NEVER silently overwrite unpushed local changes with stale cloud rows.
      const hasPendingForDomain = queue.some(
        (op) => op.ownerId === uid && (op.kind === 'upsert' || op.kind === 'delete') && op.table === domain.table,
      );

      const { data, error } = await supabase.from(domain.table).select('*').eq('user_id', uid);
      if (userId !== uid) return;
      if (error) {
        report(`Could not load "${domain.table}"`, error);
        throw error;
      }
      const rows = Array.isArray(data) ? (data as Row[]).filter((row) => row.user_id === uid) : [];
      if (rows.length > 0) {
        if (hasDirtyLocalState(uid)) {
          // Keep the owner-scoped cache; the durable baseline lets scan() queue edits/deletes after hydration.
        } else if (!hasPendingForDomain) {
          await domain.writeLocal(rows.map((row) => domain.fromRow(row)));
        } else {
          console.warn(`[clockit/sync] Preserving local edits for ${domain.table}`);
        }
      }
      if (!hasDirtyLocalState(uid)) {
        snapshots.set(domain.table, entitySignature(await domain.readLocal()));
      }
    }
    if (userId !== uid) return;
    await hydratePreferences();
    if (userId !== uid) return;
    await hydrateQuickNotes();

    updateSyncState({
      status: 'synced',
      lastSyncedAt: Date.now(),
      errorMessage: null,
    });
  } catch (error) {
    if (userId !== uid) return;
    const errorMsg = error instanceof Error ? error.message : 'Could not synchronize with cloud storage.';
    updateSyncState({ status: 'error', errorMessage: errorMsg });
    report('Cloud hydration failed', error);
    throw error;
  } finally {
    if (userId === uid) applying = false;
  }
  void flush();
}

/**
 * Public action to manually retry hydration and flush unsynced changes.
 */
export async function retrySync(): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId) return;
  try {
    updateSyncState({ status: 'syncing', errorMessage: null });
    await hydrate();
    await flush();
    toast('Cloud synchronization restored.', { kind: 'success', duration: 3000 });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Synchronization retry failed';
    updateSyncState({ status: 'error', errorMessage: errorMsg });
    toast('Cloud sync retry failed. Check your connection.', {
      kind: 'error',
      action: {
        label: 'Retry Again',
        onClick: () => {
          void retrySync();
        },
      },
      duration: 6000,
    });
  }
}

// -------------------------------------------------------------- lifecycle
function onOnline(): void {
  toast('Connection restored. Synchronizing with cloud...', { kind: 'info', duration: 3000 });
  scheduleFlush();
  void retrySync();
}

function onOffline(): void {
  updateSyncState({ status: 'offline', errorMessage: 'Working offline' });
  toast('You are offline. Changes are saved locally and will sync when reconnected.', {
    kind: 'warning',
    duration: 5000,
  });
}

function onVisibility(): void {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') scheduleFlush();
}

/**
 * Starts cloud sync for `nextUserId`. Safe to call when Supabase is not
 * configured — it simply does nothing, leaving the local-only app untouched.
 */
export async function startCloudSync(nextUserId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !nextUserId) return;
  if (started && userId === nextUserId) return;
  stopCloudSync();
  userId = nextUserId;
  started = true;
  // Establish the cache owner before any hydration or queue replay.
  setRepositoryOwner(`user:${nextUserId}`);
  snapshots.clear();
  loadSnapshots(nextUserId);
  loadQueue(nextUserId);

  try {
    await hydrate();
  } catch (error) {
    if (userId !== nextUserId) return;
    report('Cloud hydration failed', error);
    toast('Cloud synchronization unavailable. Local data is preserved.', {
      kind: 'warning',
      action: {
        label: 'Retry Sync',
        onClick: () => {
          void retrySync();
        },
      },
      duration: 8000,
    });
  }

  unsub = dataService.subscribe(scheduleScan);
  if (hasDirtyLocalState(nextUserId)) void scan();
  if (typeof window !== 'undefined') {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisibility);
  }
}

export function stopCloudSync(): void {
  if (unsub) {
    unsub();
    unsub = null;
  }
  if (scanTimer !== null) {
    window.clearTimeout(scanTimer);
    scanTimer = null;
  }
  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
    document.removeEventListener('visibilitychange', onVisibility);
  }
  started = false;
  userId = null;
  snapshots.clear();
  queue = [];
  applying = false;
  updateSyncState({ status: 'idle', lastSyncedAt: null, errorMessage: null, pendingCount: 0 });

  // Each owner has a separate local cache and durable queue; preserve both.
}
