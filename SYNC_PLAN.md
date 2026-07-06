# Offline-First Sync Plan (Ethos ↔ cashflow-notion)

Bidirectional sync between Ethos (local SQLite, offline-first) and the cashflow-notion
REST API at `/api/v1/*` (documented in `API_V1.md`). Server is the source of truth.
Conflict strategy: **last-write-wins** (LWW). Sync triggers **on app foreground**.

## Constraints & decisions

- **Base URL**: derived from `authBaseURL` (`EXPO_PUBLIC_BETTER_AUTH_URL`, default
  `https://cashflow-notion.vercel.app`) + `/api/v1`. No new env var.
- **Auth**: reuse Better Auth session from SecureStore. Every request injects
  `Cookie: authClient.getCookie()` and uses `credentials: "omit"` (per API_V1.md).
- **Server is source of truth**: no `sync_status`/`remote_id`/`last_synced_at` added
  to the Prisma schema. The Ethos SQLite schema already has these columns (see
  `src/data/cashflow/schema.ts`) — it is sync-ready.
- **Scope**: cashflow entities only (managements, entries, categories, quick fills,
  overall budgets, recurring entries). Notes are out of scope.
- **ID mapping**: local IDs are `prefix-uuid`; server IDs are UUIDs. The local
  `remote_id` column stores the server UUID once a record has been pushed/pulled.
  Push sends `{ localId, remoteId }`; server returns the canonical `remoteId`.
- **LWW**: compare server `updatedAt` (ISO) vs local `updated_at` (ISO). Latest wins.
  During a sync cycle, locally-pushed changes win over stale pulled versions of the
  same record to avoid clobbering the user's own just-made edits.
- **Soft delete**: local `deleted_at` set + `sync_status='deleted'`. Push deletes to
  server; on success, hard-delete the local row. Server deletions propagate as local
  hard-deletes.
- **Bookmark**: `last_pulled_at` (ISO) stored in the `app_preferences` SQLite table.
  Used for incremental pull where the API supports filtering (entries by date); for
  entities without a modified-since filter, full re-fetch and LWW-reconcile.

## File layout

```
src/
├── lib/
│   ├── api/
│   │   ├── client.ts          # fetch wrapper + auth header + error normalization
│   │   ├── managements.ts
│   │   ├── entries.ts
│   │   ├── categories.ts
│   │   ├── quick-fills.ts
│   │   ├── budgets.ts
│   │   ├── recurring.ts
│   │   └── types.ts           # request/response shapes mirroring API_V1.md
│   └── sync/
│       ├── syncEngine.ts      # push() -> pull() -> reconcile() -> markSynced()
│       ├── reconcile.ts       # LWW upsert/delete helpers per entity
│       ├── syncStatus.ts      # read/write sync_status, remote_id, last_synced_at, last_pulled_at
│       └── useSync.ts         # hook: foreground trigger, exposes { status, lastSync, syncNow }
└── data/cashflow/
    ├── repository.ts          # add: upsertByRemoteId(), listDirty(), hardDelete()
    └── CashflowDataProvider.tsx # call useSync(); refresh() after sync
```

## API client (`src/lib/api/client.ts`)

```ts
import { authBaseURL, authClient } from "@/lib/auth-client";

export const apiBaseURL = `${authBaseURL}/api/v1`;

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookie = authClient.getCookie();
  const res = await fetch(`${apiBaseURL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(init.headers ?? {}),
    },
    credentials: "omit", // iOS: avoid duplicate cookies
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.error ?? res.statusText);
  return json.data as T;
}
```

Helpers: `apiGet`, `apiPost`, `apiPatch`, `apiPut`, `apiDelete`.

## Sync engine (`src/lib/sync/syncEngine.ts`)

```
syncNow(db):
  1. status = "syncing"
  2. await pushDirty(db)          // pending/updated/deleted → server, update remote_id + last_synced_at
  3. await pullAndReconcile(db)   // fetch server state, LWW upsert/delete local rows
  4. await setLastPulledAt(db, now)
  5. status = "idle"
  6. refresh CashflowDataProvider state
```

### Push phase (per entity)

- Query `WHERE sync_status IN ('pending','updated','deleted')`
- For 'deleted': call DELETE endpoint; on 200/404, hard-delete local row
- For 'pending' (new): POST; store returned `id` into `remote_id`, set `sync_status='synced'`
- For 'updated': PATCH; set `sync_status='synced'`
- Update `last_synced_at = now` on success
- Batch one entity type at a time (serial) to keep causal ordering (e.g. managements before entries)

### Pull phase (per entity)

- GET list endpoint (full fetch; LWW reconcile against local)
- For each server record:
  - find local row by `remote_id = server.id`
  - if not found → INSERT with `sync_status='synced'`, `remote_id=server.id`
  - if found → compare `server.updatedAt` vs local `updated_at`; if server newer, UPDATE columns
- For local rows with `remote_id IS NOT NULL` and `sync_status='synced'` not present in server response → server deleted it → hard-delete locally

### Order

Push: managements → categories → quick_fills → overall_budgets → recurring_entries → entries
(less dependent first; entries depend on categories/managements)

Pull: same order.

## Foreground trigger (`src/lib/sync/useSync.ts`)

```ts
export function useSync() {
  const { isPending, isAuthenticated } = useAuth();
  const { refresh } = useCashflowData();
  const [status, setStatus] = useState<"idle"|"syncing"|"error">("idle");
  const [lastSync, setLastSync] = useState<Date|null>(null);

  useEffect(() => {
    if (!isAuthenticated || isPending) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void runSync();
    });
    void runSync(); // also sync on mount
    return () => sub.remove();
  }, [isAuthenticated, isPending]);

  async function runSync() { ... syncNow(db) ... refresh() ... }
  return { status, lastSync, syncNow: runSync };
}
```

Provider tree:
```
<SQLiteProvider>
  <CashflowDataProvider>
    <SyncProvider>   // wraps useSync, injects for useAuth + useCashflowData
      <DrawerProvider> ...
```

## Reconcile helpers (`src/lib/sync/reconcile.ts`)

Per-entity adapter:
```ts
type EntityAdapter<TLocal, TServer> = {
  tableName: string;
  serverToLocal: (server: TServer) => Partial<TLocal>; // map columns
  localToServer: (local: TLocal) => unknown;            // request body
  pushCreate: (local) => Promise<TServer>;
  pushUpdate: (local) => Promise<TServer>;
  pushDelete: (local) => Promise<void>;
  pullAll: () => Promise<TServer[]>;
};
```

LWW:
```ts
function newer(serverUpdatedAt: string, localUpdatedAt: string) {
  return new Date(serverUpdatedAt) > new Date(localUpdatedAt);
}
```

## syncStatus helpers (`src/lib/sync/syncStatus.ts`)

```ts
listDirty(db, table): rows WHERE sync_status IN ('pending','updated','deleted')
markSynced(db, table, localId, remoteId): set sync_status='synced', remote_id, last_synced_at
setLastPulledAt(db, iso): INSERT INTO app_preferences (key,'last_pulled_at') ...
getLastPulledAt(db): read ^
upsertByRemoteId(db, table, remoteId, fields): INSERT ... ON CONFLICT(remote_id) DO UPDATE
```

## Implementation chunks

### Chunk 0 — Purge seeded demo data (DONE)
**Goal:** Strip the deterministic demo seed (user `local-user-demo`, managements `wallet-*`, all `${mgmtId}-*` rows) from existing local DBs before any sync runs, so demo data is never pushed to production.

**Implementation:** v4 schema migration in `src/data/cashflow/schema.ts` hard-deletes seeded rows across all cashflow tables by ID pattern + the demo user ID, and clears the `active_management_id` and `last_pulled_at` preferences. Foreign keys are toggled off during the purge to allow any-order deletes, then re-enabled. Real user-created rows are untouched.

### Chunk 1 — Foundation (DONE)
1. `src/lib/api/client.ts` — fetch wrapper + `ApiError`
2. `src/lib/api/types.ts` — request/response types from API_V1.md
3. `src/lib/api/{managements,entries,categories,quick-fills,budgets,recurring}.ts` — typed endpoint wrappers
4. `src/lib/sync/syncStatus.ts` — dirty listing, mark-synced, last_pulled_at
5. `src/lib/sync/reconcile.ts` — LWW + entity adapters (entries only at first)
6. `src/lib/sync/syncEngine.ts` — push/pull orchestration (entries only)
7. `src/lib/sync/useSync.ts` — foreground hook
8. Wire `useSync` into `CashflowDataProvider` (or a `SyncProvider` between provider and drawer)
9. Add `remote_id` index on `entries` table via schema migration v3
10. TypeScript check: `npx tsc --noEmit`

### Chunk 2 — Expand entities
- categories, quick_fills, overall_budgets, recurring_entries, managements
- per-entity remote_id indexes via schema migrations

### Chunk 3 — UX
- last-sync timestamp in profile
- error toast + retry button
- in-flight guard (don't sync if already syncing)

## Schema migration (v3)

```sql
CREATE INDEX IF NOT EXISTS entries_remote_id_idx ON entries(remote_id);
-- repeat for other tables as they come online in Chunk 2
```

Update `DATABASE_VERSION` to 3 in `src/data/cashflow/schema.ts` and add the v2→v3 block.

## Verification

- `npx tsc --noEmit` must pass
- Manual: sign in, create entry offline, return online, foreground → entry should appear on web
- Manual: create entry on web, foreground app → entry appears locally

## Out of scope

- Notes sync
- User profile / theme sync (Chunk 3+)
- Background-task scheduling (only foreground for now)
- Real-time/websocket push from server
- Multipart/form-data profile image upload via API (existing Better Auth flow stays)