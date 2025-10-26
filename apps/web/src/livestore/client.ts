import { createLiveStore } from "@livestore/web";
import { BooksTable } from "./models/books";
import { NotesTable } from "./models/notes";
import { NoteRelationshipsTable } from "./models/relationships";

import {
  bookCreatedMaterializer,
  bookUpdatedMaterializer,
  bookDeletedMaterializer,
} from "./materializers/book-materializers";

import {
  noteCreatedMaterializer,
  noteUpdatedMaterializer,
  noteDeletedMaterializer,
} from "./materializers/note-materializers";

import {
  relationshipCreatedMaterializer,
  relationshipDeletedMaterializer,
} from "./materializers/relationship-materializers";

// Create and configure the LiveStore client
export const livestore = createLiveStore({
  // Read models (database tables)
  readModels: [BooksTable, NotesTable, NoteRelationshipsTable],

  // Materializers (event handlers)
  materializers: [
    // Book materializers
    bookCreatedMaterializer,
    bookUpdatedMaterializer,
    bookDeletedMaterializer,

    // Note materializers
    noteCreatedMaterializer,
    noteUpdatedMaterializer,
    noteDeletedMaterializer,

    // Relationship materializers
    relationshipCreatedMaterializer,
    relationshipDeletedMaterializer,
  ],

  // Sync configuration (for now, we'll start without syncing)
  // We'll add a sync provider later when we set up the backend
  sync: {
    enabled: false, // Start offline-only for learning
  },

  // Database name
  dbName: "marginelle",
});

// Export the client for use in React components
export default livestore;
