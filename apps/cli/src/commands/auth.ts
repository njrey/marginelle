import readline from "node:readline";
import { Command } from "commander";
import { deleteCredentials, saveCredentials } from "../lib/credentials.js";
import { print, printError } from "../lib/output.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAuthUrl(): string {
  const syncUrl = process.env["MARGINELLE_SYNC_URL"];
  const authUrl = process.env["MARGINELLE_AUTH_URL"];

  if (authUrl) return authUrl;
  if (syncUrl)
    return syncUrl.replace(/^wss?:\/\//, (m) => (m === "wss://" ? "https://" : "http://"));

  printError(
    "MARGINELLE_SYNC_URL is not set. Add it to your environment or a .env file.\n" +
      "Example: export MARGINELLE_SYNC_URL=wss://websocket-server.YOUR_ACCOUNT.workers.dev",
  );
}

async function prompt(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (hidden && process.stdout.isTTY) {
      // Disable echo for password input
      process.stdout.write(question);
      process.stdin.setRawMode(true);
      let value = "";
      process.stdin.resume();
      process.stdin.setEncoding("utf8");

      const onData = (char: string) => {
        if (char === "\r" || char === "\n") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener("data", onData);
          process.stdout.write("\n");
          rl.close();
          resolve(value);
        } else if (char === "\u0003") {
          process.stdin.setRawMode(false);
          process.exit(1);
        } else if (char === "\u007f") {
          // Backspace
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      };
      process.stdin.on("data", onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function loginAction(options: { email?: string; password?: string }): Promise<void> {
  const baseUrl = getAuthUrl();

  const email = options.email ?? (await prompt("Email: "));
  const password = options.password ?? (await prompt("Password: ", true));

  if (!email || !password) {
    printError("Email and password are required.");
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: baseUrl,
      },
      body: JSON.stringify({ email, password, rememberMe: true }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    printError(`Network error connecting to ${baseUrl}: ${msg}`);
  }

  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      /* ignore */
    }
    printError(`Login failed (HTTP ${res.status})`, body || undefined);
  }

  let data: { token?: string; user?: { id?: string } };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    printError("Unexpected response from auth server — could not parse JSON.");
  }

  // BetterAuth returns the token in the response body under `token`
  // and also sets it as a cookie. We read from the body.
  const token = data.token;
  const userId = data.user?.id;

  if (!token || !userId) {
    printError("Unexpected auth response: missing token or user id.", data);
  }

  saveCredentials({ token, userId });

  print({ success: true, userId, message: "Logged in successfully." });
}

function logoutAction(): void {
  deleteCredentials();
  print({ success: true, message: "Logged out." });
}

// ---------------------------------------------------------------------------
// Command registration
// ---------------------------------------------------------------------------

export function registerAuthCommands(program: Command): void {
  const auth = program
    .command("login")
    .description("Authenticate with your Marginelle account")
    .option("-e, --email <email>", "Email address (skips interactive prompt)")
    .option("-p, --password <password>", "Password (skips interactive prompt — use with caution)")
    .action(async (options: { email?: string; password?: string }) => {
      await loginAction(options);
    });

  void auth; // suppress unused warning

  program
    .command("logout")
    .description("Remove stored credentials")
    .action(() => {
      logoutAction();
    });
}
