/** Print a result as pretty-printed JSON to stdout. */
export function print(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/** Print an error as JSON to stderr and exit non-zero. */
export function printError(message: string, details?: unknown): never {
  console.error(
    JSON.stringify(
      details !== undefined ? { error: message, details } : { error: message },
      null,
      2,
    ),
  );
  process.exit(1);
}
