# ClockIt Data Synchronization Architecture

This document describes the local-first synchronization model, repository snapshotting, delta diffing, offline queuing, conflict handling, and cloud re-hydration.

---

## 1. Diagram E: Data Synchronization Flowchart

```mermaid
flowchart TD
  UserAction["User Mutates Data in UI (e.g. create task, complete habit)"] --> LocalRepo["Local Repository (e.g. taskRepository.create)"]

  LocalRepo --> WriteLocalStorage["Write to localStore / IndexedDB"]
  WriteLocalStorage --> NotifyObserver["dataService.notify() (Reactive UI update)"]

  NotifyObserver --> DebounceTimer["Debounced Scan (200ms) in syncEngine.ts"]
  DebounceTimer --> ComputeSnapshot["Compute Next Signature vs Snapshot Map"]

  ComputeSnapshot --> IsDifferent{"Has Changed?"}
  IsDifferent -- "No" --> Idle["Do Nothing"]
  IsDifferent -- "Yes" --> EnqueueOp["Enqueue SyncOp to FIFO Queue"]

  EnqueueOp --> PersistQueue["Persist Queue to localStore (clockit-sync-queue)"]
  PersistQueue --> NetworkCheck{"Browser Online & Supabase Configured?"}

  NetworkCheck -- "Offline" --> AwaitOnline["Keep in Queue; wait for 'online' event"]
  AwaitOnline -.-> NetworkCheck

  NetworkCheck -- "Online" --> FlushQueue["flush(): Pop SyncOp from Queue"]
  FlushQueue --> ExecutePostgres["Execute Supabase Upsert / Delete with RLS"]

  ExecutePostgres -- "Success" --> RemoveQueueItem["Remove from Queue & Update Snapshot"]
  ExecutePostgres -- "Network Error" --> RetryLater["Stop Flush & Retry on next trigger"]

  subgraph HydrationCycle ["Cloud Hydration on Login"]
    LoginEvent["User Signs In"] --> StopOldSync["stopCloudSync(): Flush memory & clear residue"]
    StopOldSync --> FetchCloud["Fetch rows from all 11 clockit_* tables"]
    FetchCloud --> CheckCount{"Rows Found?"}
    CheckCount -- "Existing Rows" --> WriteLocalCache["Write rows into local repository cache"]
    CheckCount -- "0 Rows (New User)" --> SeedDefaults["Seed default Personal workspace & empty arrays"]
    WriteLocalCache --> RebuildSnapshots["Rebuild Snapshot Map & Subscribe to changes"]
    SeedDefaults --> RebuildSnapshots
  end
```

---

## 2. Sync Engine Mechanics

### A. The Diff Algorithm
1. Every domain registers `readLocal()` and `table`.
2. `syncEngine.ts` maintains an in-memory `snapshots` map storing the JSON representation of local records keyed by table name.
3. When `scan()` executes:
   - It reads current records from the local repository.
   - Compares previous JSON with current JSON.
   - For added or modified items: enqueues `{ kind: 'upsert', table, conflict: 'user_id,client_id', payload }`.
   - For deleted items: enqueues `{ kind: 'delete', table, clientId }`.
   - Updates `snapshots.set(domain.table, signature)`.

### B. Offline Queue Durability
- The queue is written to `localStorage` under `clockit-sync-queue` including the `userId`.
- If the browser closes or loses internet connection, the pending queue is restored on boot when the same user logs in and drained sequentially once online.

### C. Re-hydration on Session Start
When `startCloudSync(userId)` is called:
1. `stopCloudSync()` executes first, purging dirty state from any prior session.
2. For each of the 11 domains, queries `supabase.from(domain.table).select('*').eq('user_id', userId)`.
3. If rows exist: maps them through `domain.fromRow()` and writes them into local storage.
4. If rows do not exist (brand new user): seeds `domain.initialRecords()` (which creates a clean Personal workspace with empty tasks and empty habits), enqueuing the initial workspace to the cloud.
5. Re-reads quick notes and user preferences.
