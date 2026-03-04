import { Command } from "commander";
import { events, tables } from "@marginelle/schema";
import { withStore } from "../lib/store.js";
import { print, printError } from "../lib/output.js";

// ---------------------------------------------------------------------------
// books list
// ---------------------------------------------------------------------------

async function listBooks(): Promise<void> {
  await withStore(async (store) => {
    const books = store.query(tables.books.where({ deletedAt: null }));
    print(books);
  });
}

// ---------------------------------------------------------------------------
// books add
// ---------------------------------------------------------------------------

async function addBook(options: { title: string; author?: string }): Promise<void> {
  if (!options.title) printError("--title is required.");

  await withStore(async (store) => {
    const id = crypto.randomUUID();
    const createdAt = Date.now();

    store.commit(
      events.bookCreated({
        id,
        title: options.title,
        author: options.author ?? null,
        createdAt,
      }),
    );

    print({ success: true, id, title: options.title, author: options.author ?? null, createdAt });
  });
}

// ---------------------------------------------------------------------------
// books show
// ---------------------------------------------------------------------------

async function showBook(id: string): Promise<void> {
  await withStore(async (store) => {
    const book = store.query(tables.books.where({ id, deletedAt: null }).first());
    if (!book) printError(`Book not found: ${id}`);
    print(book);
  });
}

// ---------------------------------------------------------------------------
// books delete
// ---------------------------------------------------------------------------

async function deleteBook(id: string): Promise<void> {
  await withStore(async (store) => {
    const book = store.query(tables.books.where({ id, deletedAt: null }).first());
    if (!book) printError(`Book not found: ${id}`);

    const now = new Date();

    // Cascade: delete relationships for all notes in this book
    const notes = store.query(tables.notes.where({ bookId: id, deletedAt: null }));
    const noteIds = new Set(notes.map((n) => n.id));

    const relationships = store.query(tables.noteRelationships.where({ deletedAt: null }));
    for (const rel of relationships) {
      if (noteIds.has(rel.fromNoteId) || noteIds.has(rel.toNoteId)) {
        store.commit(events.relationshipDeleted({ id: rel.id, deletedAt: now }));
      }
    }

    // Cascade: soft-delete all notes
    for (const note of notes) {
      store.commit(events.noteDeleted({ id: note.id, deletedAt: now }));
    }

    // Soft-delete the book itself
    store.commit(events.bookDeleted({ id, deletedAt: now }));

    print({ success: true, id, deleted: true });
  });
}

// ---------------------------------------------------------------------------
// books progress
// ---------------------------------------------------------------------------

async function updateProgress(id: string, options: { page: string }): Promise<void> {
  const currentPage = parseInt(options.page, 10);
  if (isNaN(currentPage) || currentPage < 0) {
    printError("--page must be a non-negative integer.");
  }

  await withStore(async (store) => {
    const book = store.query(tables.books.where({ id, deletedAt: null }).first());
    if (!book) printError(`Book not found: ${id}`);

    store.commit(events.bookProgressUpdated({ id, currentPage }));

    print({ success: true, id, currentPage });
  });
}

// ---------------------------------------------------------------------------
// Command registration
// ---------------------------------------------------------------------------

export function registerBookCommands(program: Command): void {
  const books = program
    .command("books")
    .description(
      "Manage books.\n\n" +
        "A book is the top-level container for all notes and relationships.\n" +
        "Create a book first, then use its ID with 'notes' and 'relationships' commands.\n\n" +
        "Typical workflow:\n" +
        "  1. marginelle books add --title 'Dune' --author 'Frank Herbert'\n" +
        "  2. marginelle notes add --book <id> --type character --title 'Paul' --page 1\n" +
        "  3. marginelle relationships add --from <noteId> --to <noteId> --type family --page 5\n\n" +
        "Run 'marginelle workflow' for a full step-by-step guide.",
    );

  books
    .command("list")
    .description("List all books")
    .action(async () => {
      await listBooks();
    });

  books
    .command("add")
    .description("Add a new book")
    .requiredOption("-t, --title <title>", "Book title")
    .option("-a, --author <author>", "Book author")
    .action(async (options: { title: string; author?: string }) => {
      await addBook(options);
    });

  books
    .command("show <id>")
    .description("Show a single book by ID")
    .action(async (id: string) => {
      await showBook(id);
    });

  books
    .command("delete <id>")
    .description("Delete a book and all its notes and relationships")
    .action(async (id: string) => {
      await deleteBook(id);
    });

  books
    .command("progress <id>")
    .description("Update reading progress for a book")
    .requiredOption("-p, --page <number>", "Current page number")
    .action(async (id: string, options: { page: string }) => {
      await updateProgress(id, options);
    });
}
