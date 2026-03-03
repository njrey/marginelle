import { Command } from "commander";
import { events, tables, type RelationshipType } from "@marginelle/schema";
import { withStore } from "../lib/store.js";
import { print, printError } from "../lib/output.js";

const RELATIONSHIP_TYPES: RelationshipType[] = [
  "impacts",
  "member_of",
  "ally",
  "enemy",
  "family",
  "friend",
  "owns",
  "located_in",
  "causes",
];

// ---------------------------------------------------------------------------
// relationships list
// ---------------------------------------------------------------------------

async function listRelationships(options: { book: string; page?: string }): Promise<void> {
  if (!options.book) printError("--book <id> is required.");

  const maxPage = options.page !== undefined ? parseInt(options.page, 10) : undefined;
  if (maxPage !== undefined && isNaN(maxPage)) {
    printError("--page must be an integer.");
  }

  await withStore(async (store) => {
    // Get all note IDs belonging to this book
    const notes = store.query(tables.notes.where({ bookId: options.book, deletedAt: null }));
    const noteIds = new Set(notes.map((n) => n.id));

    let relationships = store.query(tables.noteRelationships.where({ deletedAt: null }));

    // Filter to relationships where at least one note is in this book
    relationships = relationships.filter(
      (r) => noteIds.has(r.fromNoteId) || noteIds.has(r.toNoteId),
    );

    if (maxPage !== undefined) {
      relationships = relationships.filter((r) => r.pageNumber <= maxPage);
    }

    print(relationships);
  });
}

// ---------------------------------------------------------------------------
// relationships add
// ---------------------------------------------------------------------------

async function addRelationship(options: {
  from: string;
  to: string;
  type: string;
  description?: string;
  page: string;
}): Promise<void> {
  if (!RELATIONSHIP_TYPES.includes(options.type as RelationshipType)) {
    printError(
      `Invalid relationship type "${options.type}". Valid types: ${RELATIONSHIP_TYPES.join(", ")}`,
    );
  }

  const pageNumber = parseInt(options.page, 10);
  if (isNaN(pageNumber) || pageNumber < 0) {
    printError("--page must be a non-negative integer.");
  }

  await withStore(async (store) => {
    // Verify both notes exist
    const fromNote = store.query(tables.notes.where({ id: options.from, deletedAt: null }).first());
    if (!fromNote) printError(`Source note not found: ${options.from}`);

    const toNote = store.query(tables.notes.where({ id: options.to, deletedAt: null }).first());
    if (!toNote) printError(`Target note not found: ${options.to}`);

    const id = crypto.randomUUID();
    const createdAt = Date.now();

    store.commit(
      events.relationshipCreated({
        id,
        fromNoteId: options.from,
        toNoteId: options.to,
        relationshipType: options.type as RelationshipType,
        description: options.description ?? null,
        pageNumber,
        createdAt,
      }),
    );

    print({
      success: true,
      id,
      fromNoteId: options.from,
      toNoteId: options.to,
      relationshipType: options.type,
      description: options.description ?? null,
      pageNumber,
    });
  });
}

// ---------------------------------------------------------------------------
// relationships delete
// ---------------------------------------------------------------------------

async function deleteRelationship(id: string): Promise<void> {
  await withStore(async (store) => {
    const rel = store.query(tables.noteRelationships.where({ id, deletedAt: null }).first());
    if (!rel) printError(`Relationship not found: ${id}`);

    store.commit(events.relationshipDeleted({ id, deletedAt: new Date() }));

    print({ success: true, id, deleted: true });
  });
}

// ---------------------------------------------------------------------------
// Command registration
// ---------------------------------------------------------------------------

export function registerRelationshipCommands(program: Command): void {
  const relationships = program.command("relationships").description("Manage note relationships");

  relationships
    .command("list")
    .description("List relationships for a book")
    .requiredOption("-b, --book <id>", "Book ID")
    .option("-p, --page <number>", "Only show relationships discovered up to this page")
    .action(async (options: { book: string; page?: string }) => {
      await listRelationships(options);
    });

  relationships
    .command("add")
    .description("Create a relationship between two notes")
    .requiredOption("--from <noteId>", "Source note ID")
    .requiredOption("--to <noteId>", "Target note ID")
    .requiredOption("-t, --type <type>", `Relationship type (${RELATIONSHIP_TYPES.join("|")})`)
    .option("-d, --description <text>", "Optional description")
    .requiredOption("-p, --page <number>", "Page number where this relationship was discovered")
    .action(
      async (options: {
        from: string;
        to: string;
        type: string;
        description?: string;
        page: string;
      }) => {
        await addRelationship(options);
      },
    );

  relationships
    .command("delete <id>")
    .description("Delete a relationship")
    .action(async (id: string) => {
      await deleteRelationship(id);
    });
}
