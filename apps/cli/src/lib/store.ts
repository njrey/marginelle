import { makeAdapter } from "@livestore/adapter-node";
import { createStorePromise } from "@livestore/livestore";
import { makeCfSync } from "@livestore/sync-cf";
import { Effect } from "effect";
import { schema } from "@marginelle/schema";
import { loadCredentials } from "./credentials.js";
import { printError } from "./output.js";

// Infer the store type from the factory so it stays in sync with the schema.
type MarginelleStore = Awaited<ReturnType<typeof makeStore>>;

async function makeStore() {
  const creds = loadCredentials();
  const syncUrl = process.env["MARGINELLE_SYNC_URL"]!;

  return createStorePromise({
    adapter: makeAdapter({
      storage: { type: "fs", baseDirectory: getDataDir() },
      sync: {
        backend: makeCfSync({ url: syncUrl }),
        initialSyncOptions: { _tag: "Blocking", timeout: 8000 },
        onSyncError: "shutdown",
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
async function waitForPendingPush(store: MarginelleStore, timeoutMs = 8000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
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
    if (state.pending.length === 0 && state.upstreamHead.global === state.localHead.global) return;
    await new Promise((r) => setTimeout(r, 50));
  }
}

/**
 * Creates a LiveStore connected to the Cloudflare sync backend, runs the
 * provided callback, waits for any commits to be pushed, then cleanly shuts
 * down. Exits with a JSON error if env vars or credentials are missing.
 */
export async function withStore<T>(fn: (store: MarginelleStore) => Promise<T>): Promise<T> {
  const syncUrl = process.env["MARGINELLE_SYNC_URL"];
  if (!syncUrl) {
    printError(
      "MARGINELLE_SYNC_URL is not set. Add it to your environment or a .env file.\n" +
        "Example: export MARGINELLE_SYNC_URL=wss://websocket-server.YOUR_ACCOUNT.workers.dev",
    );
  }

  // Silence LiveStore's internal console output so our JSON-only contract holds.
  const savedLog = console.log;
  const savedInfo = console.info;
  const savedWarn = console.warn;
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};

  let store: MarginelleStore;
  try {
    store = await makeStore();
  } catch (err) {
    console.log = savedLog;
    console.info = savedInfo;
    console.warn = savedWarn;
    const msg = err instanceof Error ? err.message : String(err);
    printError(`Failed to connect to LiveStore: ${msg}`);
  }

  console.log = savedLog;
  console.info = savedInfo;
  console.warn = savedWarn;

  try {
    const result = await fn(store);
    await waitForPendingPush(store);
    return result;
  } finally {
    await store.shutdown();
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
