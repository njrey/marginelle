import { Command } from "commander";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { registerAuthCommands } from "./commands/auth.js";
import { registerBookCommands } from "./commands/books.js";
import { registerNoteCommands } from "./commands/notes.js";
import { registerRelationshipCommands } from "./commands/relationships.js";

// Auto-load .env files so users don't need to export variables manually.
// Priority: current directory > ~/.config/marginelle/.env
for (const envFile of [
  join(homedir(), ".config", "marginelle", ".env"),
  join(process.cwd(), ".env"),
]) {
  if (existsSync(envFile)) {
    // process.loadEnvFile is available in Node 20.12+
    (process as unknown as { loadEnvFile: (path: string) => void }).loadEnvFile(envFile);
  }
}

const program = new Command();

program
  .name("marginelle")
  .description("CLI for Marginelle — manage your book notes from the command line")
  .version("0.0.0");

registerAuthCommands(program);
registerBookCommands(program);
registerNoteCommands(program);
registerRelationshipCommands(program);

await program.parseAsync(process.argv);
