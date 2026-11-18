/**
 * Cloud integration entry point (Phase 12 & Phase 13.2).
 *
 * `startCloudSync` / `stopCloudSync` are the core lifecycle methods.
 * Phase 13.2 additions: `retrySync`, `getSyncState`, `subscribeToSyncState`.
 */
export {
  startCloudSync,
  stopCloudSync,
  retrySync,
  getSyncState,
  subscribeToSyncState,
  markOwnerLocalChange,
  type CloudSyncStatus,
  type CloudSyncState,
} from './syncEngine';
export { isSupabaseConfigured } from '../../lib/supabaseClient';
