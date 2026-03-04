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

// ---------------------------------------------------------------------------
// workflow — print a full end-to-end usage guide
// ---------------------------------------------------------------------------

program
  .command("workflow")
  .description("Print a step-by-step guide to the full marginelle workflow")
  .action(() => {
    console.log(`
MARGINELLE — END-TO-END WORKFLOW
═════════════════════════════════════════════════════════════════════════════

Marginelle lets you track everything you encounter while reading a book:
characters, places, organizations, events, items, and abstract concepts.
You can then link any two notes together with a typed relationship.

All commands output JSON. Errors are written to stderr with a non-zero exit code.

─────────────────────────────────────────────────────────────────────────────
STEP 1 — Authenticate
─────────────────────────────────────────────────────────────────────────────

  marginelle login
  marginelle login --email you@example.com --password secret

Credentials are stored in ~/.config/marginelle/credentials.json and reused
automatically by every subsequent command.

─────────────────────────────────────────────────────────────────────────────
STEP 2 — Create a book
─────────────────────────────────────────────────────────────────────────────

  marginelle books add --title "Dune" --author "Frank Herbert"

  Returns: { "success": true, "id": "<bookId>", "title": "Dune", ... }

  Save the returned "id" — you will pass it as --book to every notes and
  relationships command.

  Other book commands:
    marginelle books list                  List all your books
    marginelle books show <id>             Show one book
    marginelle books progress <id> --page 42   Update your current page
    marginelle books delete <id>           Delete book + all its notes/relationships

─────────────────────────────────────────────────────────────────────────────
STEP 3 — Add notes as you read
─────────────────────────────────────────────────────────────────────────────

  marginelle notes add \\
    --book <bookId> \\
    --type character \\
    --title "Paul Atreides" \\
    --content "Heir to House Atreides, trained by the Bene Gesserit" \\
    --page 3

  Returns: { "success": true, "id": "<noteId>", "type": "character", ... }

  Save each returned "id" to use when creating relationships.

  Note types (--type):
    character      A person or sentient being
    organization   A group, faction, company, or institution
    event          A notable occurrence or turning point
    location       A place, region, building, or geographic feature
    item           A physical object, artifact, or weapon
    concept        An abstract idea, theme, or belief system

  Other note commands:
    marginelle notes list --book <id>               List all notes for a book
    marginelle notes list --book <id> --type character   Filter by type
    marginelle notes list --book <id> --page 50     Only notes up to page 50
    marginelle notes show <noteId>                  Show one note
    marginelle notes update <noteId> --content "…" Update title/content/type
    marginelle notes delete <noteId>                Delete note + its relationships

─────────────────────────────────────────────────────────────────────────────
STEP 4 — Link notes with relationships
─────────────────────────────────────────────────────────────────────────────

  Once you have two or more notes, you can express how they are connected.
  The relationship is directed: --from is the subject, --to is the object.

  marginelle relationships add \\
    --from <paulId> \\
    --to <jessicaId> \\
    --type family \\
    --description "Paul is the son of Lady Jessica" \\
    --page 7

  Relationship types (--type):
    ally           Two characters or groups that support each other
    enemy          Two characters or groups in opposition or conflict
    family         A blood or legal family connection
    friend         A close personal friendship
    member_of      A character belongs to an organization  (subject --from, org --to)
    owns           A character or group possesses an item or location
    located_in     A character/item is situated in a location
    impacts        One entity has a significant effect on another (general-purpose)
    causes         One event or entity directly causes another

  Common patterns:
    character  --[family]-->     character
    character  --[friend]-->     character
    character  --[enemy]-->      character
    character  --[member_of]--> organization
    character  --[owns]-->       item
    item       --[located_in]--> location
    event      --[causes]-->     event

  Other relationship commands:
    marginelle relationships list --book <id>        List all relationships for a book
    marginelle relationships list --book <id> --page 50
    marginelle relationships delete <relId>          Delete a relationship

─────────────────────────────────────────────────────────────────────────────
PUTTING IT ALL TOGETHER — minimal example
─────────────────────────────────────────────────────────────────────────────

  marginelle login --email me@example.com --password secret

  BOOK=$(marginelle books add --title "Dune" --author "Frank Herbert" | jq -r '.id')

  PAUL=$(marginelle notes add --book $BOOK --type character \\
           --title "Paul Atreides" --page 3 | jq -r '.id')

  JESSICA=$(marginelle notes add --book $BOOK --type character \\
              --title "Lady Jessica" --page 3 | jq -r '.id')

  HOUSE=$(marginelle notes add --book $BOOK --type organization \\
            --title "House Atreides" --page 5 | jq -r '.id')

  marginelle relationships add --from $PAUL --to $JESSICA --type family --page 7
  marginelle relationships add --from $PAUL --to $HOUSE   --type member_of --page 5

═════════════════════════════════════════════════════════════════════════════
`);
  });

await program.parseAsync(process.argv);
