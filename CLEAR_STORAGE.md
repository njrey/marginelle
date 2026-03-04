# Sync Troubleshooting & Reset Runbook

This document covers how to diagnose and fix LiveStore sync issues during
development, including a full "nuclear" reset procedure.

## Background: How Sync Works

```
CLI / Web App (local SQLite via OPFS or fs)
      ↕  WebSocket
Cloudflare Durable Object  ←→  Cloudflare D1 (event log)
```

- Every write is an **event** committed to the local SQLite event log.
- The Durable Object (DO) is the single source of truth for the **global
  sequence number** (`currentHead`). It persists this in DO KV storage.
- D1 holds the **full event log**, used by new clients for initial pulls.
- Browser clients use **OPFS** (Origin Private File System) as local storage.
- The CLI uses `~/.local/share/marginelle/<storeId>/` as local storage.

Sync breaks when these three sources of truth diverge.

---

## Diagnosing the Problem

### 1. Check D1 event count

```bash
cd apps/web
npx wrangler d1 execute marginelle-sync --remote \
  --command "SELECT name, COUNT(*) as cnt FROM \"eventlog_7_<storeId>\" GROUP BY name;"
```

Replace `<storeId>` with the value from `~/.config/marginelle/credentials.json`
(the `userId` field).

### 2. Check local CLI event count

```bash
sqlite3 ~/.local/share/marginelle/<storeId>/eventlog@4.db \
  "SELECT COUNT(*), MAX(seqNumGlobal) FROM eventlog;"
```

Check sync acknowledgement status (how many events the DO has confirmed):

```bash
sqlite3 ~/.local/share/marginelle/<storeId>/eventlog@4.db \
  "SELECT * FROM __livestore_sync_status;"
```

### 3. Check the DO's current head via AdminInfoReq

```bash
TOKEN=$(cat ~/.config/marginelle/credentials.json | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
STORE_ID=$(cat ~/.config/marginelle/credentials.json | python3 -c "import sys,json; print(json.load(sys.stdin)['userId'])")
WS_PATH=$(ls -d node_modules/.pnpm/ws@*/node_modules/ws | tail -1)

node -e "
const { WebSocket } = require('$WS_PATH');
const url = new URL(process.env.MARGINELLE_SYNC_URL + '/websocket');
url.searchParams.set('storeId', '$STORE_ID');
url.searchParams.set('payload', JSON.stringify({ authToken: '$TOKEN', storeId: '$STORE_ID' }));
const ws = new WebSocket(url.toString());
ws.on('open', () => ws.send(JSON.stringify({ _tag: 'WSMessage.AdminInfoReq', requestId: 'info', adminSecret: process.env.DO_ADMIN_SECRET })));
ws.on('message', d => { console.log(d.toString()); ws.close(); process.exit(0); });
ws.on('error', e => { console.error(e.message); process.exit(1); });
setTimeout(() => process.exit(1), 8000);
"
```

### 4. Common symptoms

| Symptom                                             | Likely cause                               |
| --------------------------------------------------- | ------------------------------------------ |
| Browser shows old/stale data after login            | Browser OPFS has stale local SQLite        |
| CLI writes succeed locally but web doesn't see them | D1 is behind local (D1 write race)         |
| CLI gets "Invalid parent event number"              | DO `currentHead` is out of sync with local |
| Events in D1 but web app shows nothing              | DO `currentHead` is behind D1              |

---

## Fix 1: Stale Browser OPFS

The browser's local SQLite is out of sync with D1. Fix by clearing OPFS so the
web app does a fresh pull from the DO.

Open DevTools Console on the app's origin and run:

```javascript
(async () => {
  const root = await navigator.storage.getDirectory();
  for await (const name of root.keys()) {
    await root.removeEntry(name, { recursive: true });
    console.log("deleted:", name);
  }
  console.log("done — hard reload the page");
})();
```

Then hard-reload (Ctrl+Shift+R / Cmd+Shift+R).

---

## Fix 2: D1 Behind Local SQLite (D1 Write Race)

The DO accepted events (updated its `currentHead` in KV) but the background D1
INSERT didn't complete before the WebSocket closed. The DO knows about the
events but D1 doesn't have them, so new browser clients can't pull them.

Replay all local events directly into D1:

```bash
STORE_ID=$(cat ~/.config/marginelle/credentials.json | python3 -c "import sys,json; print(json.load(sys.stdin)['userId'])")
TABLE="eventlog_7_${STORE_ID}"
DB_PATH=~/.local/share/marginelle/${STORE_ID}/eventlog@4.db

sqlite3 "$DB_PATH" \
  "SELECT seqNumGlobal, parentSeqNumGlobal, name, argsJson, clientId, sessionId FROM eventlog ORDER BY seqNumGlobal;" \
| python3 -c "
import sys
table = '$TABLE'
for line in sys.stdin:
    parts = line.rstrip('\n').split('|')
    seq, parent, name, args, client, session = parts[0], parts[1], parts[2], '|'.join(parts[3:-2]), parts[-2], parts[-1]
    args_esc = args.replace(\"'\", \"''\")
    print(f\"INSERT OR IGNORE INTO \\\"{table}\\\" (seqNum, parentSeqNum, name, args, createdAt, clientId, sessionId) VALUES ({seq}, {parent}, '{name}', '{args_esc}', datetime('now'), '{client}', '{session}');\")
" > /tmp/replay_events.sql

cd apps/web
npx wrangler d1 execute marginelle-sync --remote --file /tmp/replay_events.sql
```

After this, clear the browser OPFS (Fix 1) so it pulls the full event log fresh.

---

## Fix 3: DO currentHead Out of Sync

The DO's in-memory or KV `currentHead` doesn't match local/D1. This causes
"Invalid parent event number" errors on push.

### Step 1 — Reset the DO's KV storage

```bash
TOKEN=$(cat ~/.config/marginelle/credentials.json | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
STORE_ID=$(cat ~/.config/marginelle/credentials.json | python3 -c "import sys,json; print(json.load(sys.stdin)['userId'])")
WS_PATH=$(ls -d /home/$(whoami)/repos/marginelle/node_modules/.pnpm/ws@*/node_modules/ws | tail -1)

node -e "
const { WebSocket } = require('$WS_PATH');
const url = new URL(process.env.MARGINELLE_SYNC_URL + '/websocket');
url.searchParams.set('storeId', '$STORE_ID');
url.searchParams.set('payload', JSON.stringify({ authToken: '$TOKEN', storeId: '$STORE_ID' }));
const ws = new WebSocket(url.toString());
ws.on('open', () => ws.send(JSON.stringify({ _tag: 'WSMessage.AdminResetRoomReq', requestId: 'reset', adminSecret: process.env.DO_ADMIN_SECRET })));
ws.on('message', d => { console.log(d.toString()); ws.close(); process.exit(0); });
ws.on('error', e => { console.error(e.message); process.exit(1); });
setTimeout(() => process.exit(1), 8000);
"
```

Note: `AdminResetRoomReq` clears KV but **not** the DO's in-memory
`currentHead`. The in-memory value persists until the DO instance is evicted
(can take minutes to hours of idle time). To force eviction immediately, do a
new `wrangler deploy` — a new deploy always evicts the running instance.

### Step 2 — Reset the local SQLite sync head

```bash
STORE_ID=$(cat ~/.config/marginelle/credentials.json | python3 -c "import sys,json; print(json.load(sys.stdin)['userId'])")
DB_PATH=~/.local/share/marginelle/${STORE_ID}/eventlog@4.db

sqlite3 "$DB_PATH" "
  UPDATE __livestore_sync_status SET head = 0;
  UPDATE eventlog SET syncMetadataJson = '{\"_tag\":\"None\"}';
"
```

### Step 3 — Trigger re-push

Run any CLI command (e.g. `marginelle books list`). LiveStore will push all
local events to the freshly-reset DO.

---

## ☢️ Nuclear Reset

Wipes **everything**: all data in D1, the DO instance, the CLI's local SQLite,
and the browser OPFS. Use this when you want a completely clean slate.

> ⚠️ This destroys all data permanently. There is no undo.

### Step 1 — Deploy a new DO class (evicts the live instance)

Each rename in `wrangler.toml` creates a fresh DO namespace. Add a new
migration to `apps/web/wrangler.toml`:

```toml
# Increment the tag and class name each time you do a nuclear reset.
# Current latest: v3 / WebSocketServerV3

[[migrations]]
tag = "v4"
renamed_classes = [{from = "WebSocketServerV3", to = "WebSocketServerV4"}]
```

Update the binding:

```toml
[[durable_objects.bindings]]
name = "WEBSOCKET_SERVER"
class_name = "WebSocketServerV4"
```

Update the class name in `apps/web/src/cf-worker/index.ts`:

```ts
export class WebSocketServerV4 extends BaseDurableObject { ... }
```

Then deploy:

```bash
cd apps/web
npx wrangler deploy
```

### Step 2 — Drop the D1 event log table

```bash
STORE_ID=$(cat ~/.config/marginelle/credentials.json | python3 -c "import sys,json; print(json.load(sys.stdin)['userId'])")

cd apps/web
npx wrangler d1 execute marginelle-sync --remote \
  --command "DROP TABLE IF EXISTS \"eventlog_7_${STORE_ID}\";"
```

### Step 3 — Wipe the CLI's local SQLite

```bash
STORE_ID=$(cat ~/.config/marginelle/credentials.json | python3 -c "import sys,json; print(json.load(sys.stdin)['userId'])")
rm -rf ~/.local/share/marginelle/${STORE_ID}/
```

### Step 4 — Clear the browser OPFS

In DevTools Console on the app origin:

```javascript
(async () => {
  const root = await navigator.storage.getDirectory();
  for await (const name of root.keys()) {
    await root.removeEntry(name, { recursive: true });
    console.log("deleted:", name);
  }
  console.log("done — hard reload the page");
})();
```

### Step 5 — Verify clean state

```bash
# Local should be empty
ls ~/.local/share/marginelle/

# D1 table should not exist (or have 0 rows after first CLI command recreates it)
cd apps/web
npx wrangler d1 execute marginelle-sync --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'eventlog%';"
```

All three storage layers are now empty. The DO will recreate the D1 table and
initialize `currentHead` to 0 on the next WebSocket connection.

---

## Keeping Track of the DO Version

The current DO class name is stored in `apps/web/wrangler.toml`. The nuclear
reset procedure increments this. To avoid confusion, keep a comment in
`wrangler.toml` noting the current version:

```toml
# DO class version history:
#   v1 — WebSocketServer (original)
#   v2 — WebSocketServerV2 (renamed from v1, March 2026)
#   v3 — WebSocketServerV3 (renamed from v2, March 2026)
#   v4 — WebSocketServerV4 (nuclear reset, <date>)
```
