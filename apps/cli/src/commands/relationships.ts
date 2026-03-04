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

const RELATIONSHIP_TYPE_DESCRIPTIONS: Record<RelationshipType, string> = {
  ally: "Two characters or groups that support each other",
  enemy: "Two characters or groups in opposition or conflict",
  family: "A blood or legal family connection (parent, sibling, spouse, etc.)",
  friend: "A close personal friendship",
  member_of: "A character belongs to an organization or group",
  owns: "A character or group possesses an item or location",
  located_in: "A character, item, or organization is situated in a location",
  impacts: "One entity has a significant effect on another (general-purpose)",
  causes: "One event or entity directly causes another event or outcome",
};

// ---------------------------------------------------------------------------
// Command registration
// ---------------------------------------------------------------------------

export function registerRelationshipCommands(program: Command): void {
  const typeList = RELATIONSHIP_TYPES.map(
    (t) => `  ${t.padEnd(14)} ${RELATIONSHIP_TYPE_DESCRIPTIONS[t]}`,
  ).join("\n");

  const relationships = program
    .command("relationships")
    .description(
      "Manage relationships between notes.\n\n" +
        "A relationship links two notes together and describes how they are connected.\n" +
        "Both notes must already exist (create them with 'marginelle notes add' first).\n\n" +
        "Relationship types:\n" +
        typeList +
        "\n\n" +
        "Workflow example:\n" +
        "  # 1. Create notes for two characters\n" +
        "  marginelle notes add --book <bookId> --type character --title 'Frodo' --page 1\n" +
        "  marginelle notes add --book <bookId> --type character --title 'Sam' --page 1\n\n" +
        "  # 2. Link them with a relationship\n" +
        "  marginelle relationships add --from <frodoId> --to <samId> --type friend --page 10\n\n" +
        "  # 3. A character can also belong to an organization\n" +
        "  marginelle notes add --book <bookId> --type organization --title 'The Fellowship' --page 20\n" +
        "  marginelle relationships add --from <frodoId> --to <fellowshipId> --type member_of --page 20\n\n" +
        "Run 'marginelle workflow' for a full step-by-step guide.",
    );

  relationships
    .command("list")
    .description("List all relationships for a book")
    .requiredOption("-b, --book <id>", "Book ID")
    .option("-p, --page <number>", "Only show relationships discovered up to this page number")
    .action(async (options: { book: string; page?: string }) => {
      await listRelationships(options);
    });

  relationships
    .command("add")
    .description(
      "Create a directed relationship between two notes.\n\n" +
        "Both --from and --to must be valid note IDs (use 'marginelle notes list --book <id>').\n" +
        "The direction is meaningful: --from is the subject, --to is the object.\n" +
        "Example: Frodo (--from) member_of Fellowship (--to)\n\n" +
        "Relationship types:\n" +
        typeList,
    )
    .requiredOption("--from <noteId>", "ID of the source note (the subject of the relationship)")
    .requiredOption("--to <noteId>", "ID of the target note (the object of the relationship)")
    .requiredOption(
      "-t, --type <type>",
      `How the two notes are related. Valid values: ${RELATIONSHIP_TYPES.join(", ")}`,
    )
    .option("-d, --description <text>", "Optional free-text description of this relationship")
    .requiredOption("-p, --page <number>", "Page number where this relationship was first evident")
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
    .description("Delete a relationship by its ID (does not delete the notes themselves)")
    .action(async (id: string) => {
      await deleteRelationship(id);
    });
}
