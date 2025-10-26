import { defineMaterializer } from "@livestore/livestore";
import { NotesTable } from "../models/notes";
import { NoteCreated, NoteUpdated, NoteDeleted } from "../events/note-events";

// Materializer for NoteCreated event
// Inserts a new note into the database
export const noteCreatedMaterializer = defineMaterializer({
  event: NoteCreated,
  readModel: NotesTable,
  materialize: ({ event, tx }) => {
    tx.insert(NotesTable).values({
      id: event.payload.id,
      bookId: event.payload.bookId,
      type: event.payload.type,
      title: event.payload.title,
      content: event.payload.content,
      metadata: event.payload.metadata,
      createdAt: event.payload.createdAt,
      updatedAt: event.payload.updatedAt,
    });
  },
});

// Materializer for NoteUpdated event
// Updates an existing note in the database
export const noteUpdatedMaterializer = defineMaterializer({
  event: NoteUpdated,
  readModel: NotesTable,
  materialize: ({ event, tx }) => {
    const updates: Partial<typeof NotesTable.Type> = {
      updatedAt: event.payload.updatedAt,
    };

    if (event.payload.type !== undefined) {
      updates.type = event.payload.type;
    }
    if (event.payload.title !== undefined) {
      updates.title = event.payload.title;
    }
    if (event.payload.content !== undefined) {
      updates.content = event.payload.content;
    }
    if (event.payload.metadata !== undefined) {
      updates.metadata = event.payload.metadata;
    }

    tx.update(NotesTable)
      .set(updates)
      .where({ id: event.payload.id });
  },
});

// Materializer for NoteDeleted event
// Deletes a note from the database
export const noteDeletedMaterializer = defineMaterializer({
  event: NoteDeleted,
  readModel: NotesTable,
  materialize: ({ event, tx }) => {
    tx.delete(NotesTable).where({ id: event.payload.id });
  },
});
