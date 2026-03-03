import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface Credentials {
  token: string;
  userId: string;
}

function credentialsPath(): string {
  return path.join(os.homedir(), ".config", "marginelle", "credentials.json");
}

export function saveCredentials(creds: Credentials): void {
  const dir = path.dirname(credentialsPath());
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(credentialsPath(), JSON.stringify(creds, null, 2), { mode: 0o600 });
}

export function loadCredentials(): Credentials {
  const p = credentialsPath();
  if (!fs.existsSync(p)) {
    throw new Error("Not logged in. Run `marginelle login` first.");
  }
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw) as Credentials;
}

export function deleteCredentials(): void {
  const p = credentialsPath();
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
  }
}

export function credentialsExist(): boolean {
  return fs.existsSync(credentialsPath());
}
