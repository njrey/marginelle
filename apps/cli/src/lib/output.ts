/**
 * Output helpers for the Marginelle CLI.
 *
 * LiveStore spawns worker threads that write debug output directly to the
 * process's stdout file descriptor, bypassing any patches to process.stdout or
 * console.log on the main thread. To keep our JSON-only stdout contract intact
 * we buffer calls to `print()` made inside a `withStore` callback and flush the
 * buffer after the store (and its worker threads) have fully shut down.
 */

let outputBuffer: string | null = null;

/** Called by withStore before opening the store to enable buffering. */
export function enableOutputBuffer(): void {
  outputBuffer = null;
}

/** Called by withStore after shutdown to flush the buffer to real stdout. */
export function flushOutputBuffer(): void {
  if (outputBuffer !== null) {
    process.stdout.write(outputBuffer);
  }
  outputBuffer = null;
}

/** Print a result as pretty-printed JSON to stdout (or buffer it if inside withStore). */
export function print(data: unknown): void {
  const json = JSON.stringify(data, null, 2) + "\n";
  if (outputBuffer !== null) {
    outputBuffer += json;
  } else {
    process.stdout.write(json);
  }
}

/** Print an error as JSON to stderr and exit non-zero. */
export function printError(message: string, details?: unknown): never {
  process.stderr.write(
    JSON.stringify(
      details !== undefined ? { error: message, details } : { error: message },
      null,
      2,
    ) + "\n",
  );
  process.exit(1);
}
