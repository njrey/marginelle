import { makeAdapter } from "@livestore/adapter-node";
import { createStorePromise } from "@livestore/livestore";
import { makeCfSync } from "@livestore/sync-cf";
import { Effect } from "effect";
import { schema } from "@marginelle/schema";
import { loadCredentials } from "./credentials.js";
import { enableOutputBuffer, flushOutputBuffer, printError } from "./output.js";

// Infer the store type from the factory so it stays in sync with the schema.
type MarginelleStore = Awaited<ReturnType<typeof makeStore>>;

async function makeStore() {
  const creds = loadCredentials();
  const syncUrl = process.env["MARGINELLE_SYNC_URL"]!;

  // Each CLI invocation gets a unique sessionId so the Durable Object treats
  // it as a distinct session. The default "static" sessionId causes sequence
  // conflicts when multiple CLI processes run concurrently against the same
  // local SQLite file — the DO rejects events from later processes with
  // "Invalid parent event number" because it has already advanced the
  // per-session sequence for the "static" session.
  const sessionId = crypto.randomUUID();

  return createStorePromise({
    adapter: makeAdapter({
      storage: { type: "fs", baseDirectory: getDataDir() },
      sessionId,
      sync: {
        backend: makeCfSync({ url: syncUrl }),
        initialSyncOptions: { _tag: "Blocking", timeout: 8000 },
        onSyncError: "ignore",
      },
    }),
    schema,
    storeId: creds.userId,
    syncPayload: { authToken: creds.token, storeId: creds.userId },
  });
}

/**
 * Wait until all locally-committed events have been acknowledged by the
 * Cloudflare Durable Object (i.e. upstreamHead catches up to localHead),
 * or the timeout elapses. This ensures writes are visible to other clients
 * before we exit.
 *
 * `syncProcessor.syncState` is a `Subscribable<SyncState, never, never>` which
 * extends `Effect.Effect<SyncState, never, never>`. We run it via
 * `Effect.runPromise` to get a snapshot of the current state each tick.
 */
async function waitForPendingPush(store: MarginelleStore, timeoutMs = 15000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastState: { pending: number; upstream: number; local: number } | null = null;
  while (Date.now() < deadline) {
    const state = await Effect.runPromise(
      store.syncProcessor.syncState as unknown as Effect.Effect<
        {
          pending: readonly unknown[];
          upstreamHead: { global: number };
          localHead: { global: number };
        },
        never,
        never
      >,
    );
    lastState = {
      pending: state.pending.length,
      upstream: state.upstreamHead.global,
      local: state.localHead.global,
    };
    if (state.pending.length === 0 && state.upstreamHead.global === state.localHead.global) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  // Warn on stderr (not stdout) so the JSON contract is preserved
  if (lastState && lastState.upstream !== lastState.local) {
    process.stderr.write(
      JSON.stringify({
        warning: "sync timeout: upstream did not catch up to local head",
        ...lastState,
      }) + "\n",
    );
  }
}

/**
 * Creates a LiveStore connected to the Cloudflare sync backend, runs the
 * provided callback, waits for any commits to be pushed, then cleanly shuts
 * down. Exits with a JSON error if env vars or credentials are missing.
 *
 * Output strategy: LiveStore's worker threads write debug lines directly to the
 * process stdout fd during shutdown, bypassing any main-thread console/stdout
 * patches. We buffer all print() calls made inside `fn` and flush them after
 * store.shutdown() completes (at which point all worker threads have exited),
 * guaranteeing clean JSON-only stdout.
 */
export async function withStore<T>(fn: (store: MarginelleStore) => Promise<T>): Promise<T> {
  const syncUrl = process.env["MARGINELLE_SYNC_URL"];
  if (!syncUrl) {
    printError(
      "MARGINELLE_SYNC_URL is not set. Add it to your environment or a .env file.\n" +
        "Example: export MARGINELLE_SYNC_URL=wss://websocket-server.YOUR_ACCOUNT.workers.dev",
    );
  }

  // Buffer print() calls until after shutdown.
  enableOutputBuffer();

  // Silence LiveStore's console output on the main thread.
  const savedLog = console.log;
  const savedInfo = console.info;
  const savedWarn = console.warn;
  const savedDebug = console.debug;
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.debug = () => {};

  const restoreConsole = () => {
    console.log = savedLog;
    console.info = savedInfo;
    console.warn = savedWarn;
    console.debug = savedDebug;
  };

  let store: MarginelleStore;
  try {
    store = await makeStore();
  } catch (err) {
    restoreConsole();
    flushOutputBuffer();
    const msg = err instanceof Error ? err.message : String(err);
    printError(`Failed to connect to LiveStore: ${msg}`);
  }

  try {
    const result = await fn(store);
    await waitForPendingPush(store);
    // Give the Durable Object's background D1 write fiber time to complete.
    // The DO forks the D1 write and sends PushAck before the write finishes.
    // If we close the WebSocket immediately after receiving PushAck, the DO
    // invocation may be evicted before the D1 INSERT completes.
    await new Promise((r) => setTimeout(r, 800));
    return result;
  } finally {
    await store.shutdown();
    restoreConsole();
    // Flush buffered JSON now that worker threads have fully exited.
    flushOutputBuffer();
  }
}

function getDataDir(): string {
  const xdg = process.env["XDG_DATA_HOME"];
  if (xdg) return `${xdg}/marginelle`;

  const home = process.env["HOME"] ?? process.env["USERPROFILE"] ?? ".";
  if (process.platform === "darwin") return `${home}/Library/Application Support/marginelle`;
  if (process.platform === "win32") {
    const appdata = process.env["APPDATA"] ?? home;
    return `${appdata}/marginelle`;
  }
  return `${home}/.local/share/marginelle`;
}
