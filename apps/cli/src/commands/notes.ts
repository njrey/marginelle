import { Command } from "commander";
import { events, tables, type NoteType } from "@marginelle/schema";
import { withStore } from "../lib/store.js";
import { print, printError } from "../lib/output.js";

const NOTE_TYPES: NoteType[] = [
  "character",
  "organization",
  "event",
  "location",
  "item",
  "concept",
];

// ---------------------------------------------------------------------------
// notes list
// ---------------------------------------------------------------------------

async function listNotes(options: { book: string; type?: string; page?: string }): Promise<void> {
  if (!options.book) printError("--book <id> is required.");

  const maxPage = options.page !== undefined ? parseInt(options.page, 10) : undefined;
  if (maxPage !== undefined && isNaN(maxPage)) {
    printError("--page must be an integer.");
  }

  if (options.type && !NOTE_TYPES.includes(options.type as NoteType)) {
    printError(`Invalid note type "${options.type}". Valid types: ${NOTE_TYPES.join(", ")}`);
  }

  await withStore(async (store) => {
    let notes = store.query(tables.notes.where({ bookId: options.book, deletedAt: null }));

    if (options.type) {
      notes = notes.filter((n) => n.type === options.type);
    }

    if (maxPage !== undefined) {
      notes = notes.filter((n) => n.pageNumber <= maxPage);
    }

    print(notes);
  });
}

// ---------------------------------------------------------------------------
// notes add
// ---------------------------------------------------------------------------

async function addNote(options: {
  book: string;
  type: string;
  title: string;
  content?: string;
  page: string;
}): Promise<void> {
  if (!options.book) printError("--book <id> is required.");
  if (!options.title) printError("--title is required.");

  if (!NOTE_TYPES.includes(options.type as NoteType)) {
    printError(`Invalid note type "${options.type}". Valid types: ${NOTE_TYPES.join(", ")}`);
  }

  const pageNumber = parseInt(options.page, 10);
  if (isNaN(pageNumber) || pageNumber < 0) {
    printError("--page must be a non-negative integer.");
  }

  await withStore(async (store) => {
    // Verify book exists
    const book = store.query(tables.books.where({ id: options.book, deletedAt: null }).first());
    if (!book) printError(`Book not found: ${options.book}`);

    const id = crypto.randomUUID();
    const now = Date.now();

    store.commit(
      events.noteCreated({
        id,
        bookId: options.book,
        type: options.type as NoteType,
        title: options.title,
        content: options.content ?? null,
        pageNumber,
        createdAt: now,
        updatedAt: now,
      }),
    );

    print({
      success: true,
      id,
      bookId: options.book,
      type: options.type,
      title: options.title,
      content: options.content ?? null,
      pageNumber,
    });
  });
}

// ---------------------------------------------------------------------------
// notes show
// ---------------------------------------------------------------------------

async function showNote(id: string): Promise<void> {
  await withStore(async (store) => {
    const note = store.query(tables.notes.where({ id, deletedAt: null }).first());
    if (!note) printError(`Note not found: ${id}`);
    print(note);
  });
}

// ---------------------------------------------------------------------------
// notes update
// ---------------------------------------------------------------------------

async function updateNote(
  id: string,
  options: { title?: string; content?: string; type?: string },
): Promise<void> {
  if (!options.title && !options.content && !options.type) {
    printError("Provide at least one of --title, --content, or --type to update.");
  }

  if (options.type && !NOTE_TYPES.includes(options.type as NoteType)) {
    printError(`Invalid note type "${options.type}". Valid types: ${NOTE_TYPES.join(", ")}`);
  }

  await withStore(async (store) => {
    const note = store.query(tables.notes.where({ id, deletedAt: null }).first());
    if (!note) printError(`Note not found: ${id}`);

    store.commit(
      events.noteUpdated({
        id,
        ...(options.type ? { type: options.type as NoteType } : {}),
        ...(options.title !== undefined ? { title: options.title } : {}),
        ...(options.content !== undefined ? { content: options.content } : {}),
        updatedAt: Date.now(),
      }),
    );

    print({ success: true, id });
  });
}

// ---------------------------------------------------------------------------
// notes delete
// ---------------------------------------------------------------------------

async function deleteNote(id: string): Promise<void> {
  await withStore(async (store) => {
    const note = store.query(tables.notes.where({ id, deletedAt: null }).first());
    if (!note) printError(`Note not found: ${id}`);

    const now = new Date();

    // Cascade: soft-delete relationships involving this note
    const relationships = store.query(tables.noteRelationships.where({ deletedAt: null }));
    for (const rel of relationships) {
      if (rel.fromNoteId === id || rel.toNoteId === id) {
        store.commit(events.relationshipDeleted({ id: rel.id, deletedAt: now }));
      }
    }

    store.commit(events.noteDeleted({ id, deletedAt: now }));

    print({ success: true, id, deleted: true });
  });
}

// ---------------------------------------------------------------------------
// Command registration
// ---------------------------------------------------------------------------

const NOTE_TYPE_DESCRIPTIONS: Record<NoteType, string> = {
  character: "A person or sentient being in the story",
  organization: "A group, faction, company, guild, or institution",
  event: "A notable occurrence, battle, ceremony, or turning point",
  location: "A place, region, building, or geographic feature",
  item: "A physical object, artifact, weapon, or possession",
  concept: "An abstract idea, theme, magic system, law, or belief",
};

export function registerNoteCommands(program: Command): void {
  const typeList = NOTE_TYPES.map((t) => `  ${t.padEnd(14)} ${NOTE_TYPE_DESCRIPTIONS[t]}`).join(
    "\n",
  );

  const notes = program
    .command("notes")
    .description(
      "Manage notes for a book.\n\n" +
        "A note captures anything worth tracking while reading — characters, places,\n" +
        "organizations, events, items, or abstract concepts. Each note belongs to a\n" +
        "book and records the page where it was first encountered.\n\n" +
        "Note types:\n" +
        typeList +
        "\n\n" +
        "After creating notes you can link them together with 'relationships'.\n" +
        "Example: create a note for 'Gandalf' and one for 'Frodo', then add a\n" +
        "relationship of type 'friend' between them.\n\n" +
        "Run 'marginelle workflow' for a full step-by-step guide.",
    );

  notes
    .command("list")
    .description("List notes for a book")
    .requiredOption("-b, --book <id>", "Book ID")
    .option("-t, --type <type>", `Filter by note type. Valid values: ${NOTE_TYPES.join(", ")}`)
    .option("-p, --page <number>", "Only show notes discovered up to this page number")
    .action(async (options: { book: string; type?: string; page?: string }) => {
      await listNotes(options);
    });

  notes
    .command("add")
    .description("Add a note to a book.\n\n" + "Note types:\n" + typeList)
    .requiredOption("-b, --book <id>", "Book ID (from 'marginelle books list')")
    .requiredOption(
      "-t, --type <type>",
      `What kind of thing this note is about. Valid values: ${NOTE_TYPES.join(", ")}`,
    )
    .requiredOption("--title <title>", "Short name or title for the note (e.g. character name)")
    .option("-c, --content <text>", "Longer description or notes about this entry")
    .requiredOption("-p, --page <number>", "Page number where this was first encountered")
    .action(
      async (options: {
        book: string;
        type: string;
        title: string;
        content?: string;
        page: string;
      }) => {
        await addNote(options);
      },
    );

  notes
    .command("show <id>")
    .description("Show a single note by ID, including its type, content, and page number")
    .action(async (id: string) => {
      await showNote(id);
    });

  notes
    .command("update <id>")
    .description("Update the title, content, or type of an existing note")
    .option("--title <title>", "New title")
    .option("-c, --content <text>", "New content / description")
    .option("-t, --type <type>", `Change the note type. Valid values: ${NOTE_TYPES.join(", ")}`)
    .action(async (id: string, options: { title?: string; content?: string; type?: string }) => {
      await updateNote(id, options);
    });

  notes
    .command("delete <id>")
    .description("Delete a note and all relationships that involve it (cascade delete)")
    .action(async (id: string) => {
      await deleteNote(id);
    });
}
