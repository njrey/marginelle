import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const books = sqliteTable("books", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  bookId: text("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "character", "organization", "event", etc.
  title: text("title").notNull(),
  content: text("content"),
  metadata: text("metadata", { mode: "json" }), // For type-specific data
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const noteRelationships = sqliteTable("note_relationships", {
  id: text("id").primaryKey(),
  fromNoteId: text("from_note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  toNoteId: text("to_note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  relationshipType: text("relationship_type").notNull(), // "impacts", "member_of", "ally", "enemy", etc.
  description: text("description"), // Optional context about the relationship
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// Relations
export const booksRelations = relations(books, ({ many }) => ({
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  book: one(books, {
    fields: [notes.bookId],
    references: [books.id],
  }),
  relationshipsFrom: many(noteRelationships, { relationName: "from" }),
  relationshipsTo: many(noteRelationships, { relationName: "to" }),
}));

export const noteRelationshipsRelations = relations(noteRelationships, ({ one }) => ({
  fromNote: one(notes, {
    fields: [noteRelationships.fromNoteId],
    references: [notes.id],
    relationName: "from",
  }),
  toNote: one(notes, {
    fields: [noteRelationships.toNoteId],
    references: [notes.id],
    relationName: "to",
  }),
}));

// Type exports
export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type NoteRelationship = typeof noteRelationships.$inferSelect;
export type NewNoteRelationship = typeof noteRelationships.$inferInsert;

// Enum-like constants for note types and relationship types
export const NOTE_TYPES = {
  CHARACTER: "character",
  ORGANIZATION: "organization",
  EVENT: "event",
  LOCATION: "location",
  ITEM: "item",
  CONCEPT: "concept",
} as const;

export const RELATIONSHIP_TYPES = {
  IMPACTS: "impacts",
  MEMBER_OF: "member_of",
  ALLY: "ally",
  ENEMY: "enemy",
  FAMILY: "family",
  FRIEND: "friend",
  OWNS: "owns",
  LOCATED_IN: "located_in",
  CAUSES: "causes",
} as const;

export type NoteType = typeof NOTE_TYPES[keyof typeof NOTE_TYPES];
export type RelationshipType = typeof RELATIONSHIP_TYPES[keyof typeof RELATIONSHIP_TYPES];
