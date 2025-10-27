import { Events, makeSchema, Schema, State } from '@livestore/livestore'

// Note type literal union
const NoteTypeSchema = Schema.Literal(
  'character',
  'organization',
  'event',
  'location',
  'item',
  'concept'
)

// Relationship type literal union
const RelationshipTypeSchema = Schema.Literal(
  'impacts',
  'member_of',
  'ally',
  'enemy',
  'family',
  'friend',
  'owns',
  'located_in',
  'causes'
)

// Define tables
export const tables = {
  books: State.SQLite.table({
    name: 'books',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      title: State.SQLite.text(),
      author: State.SQLite.text({ nullable: true }),
      createdAt: State.SQLite.integer(), // timestamp in milliseconds
      deletedAt: State.SQLite.integer({ nullable: true, schema: Schema.DateFromNumber }), // timestamp for soft delete
    },
  }),

  notes: State.SQLite.table({
    name: 'notes',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      bookId: State.SQLite.text(),
      type: State.SQLite.text({ schema: NoteTypeSchema }),
      title: State.SQLite.text(),
      content: State.SQLite.text({ nullable: true }),
      metadata: State.SQLite.text({ nullable: true, schema: Schema.parseJson(Schema.Unknown) }),
      createdAt: State.SQLite.integer(),
      updatedAt: State.SQLite.integer(),
      deletedAt: State.SQLite.integer({ nullable: true, schema: Schema.DateFromNumber }),
    },
  }),

  noteRelationships: State.SQLite.table({
    name: 'note_relationships',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      fromNoteId: State.SQLite.text(),
      toNoteId: State.SQLite.text(),
      relationshipType: State.SQLite.text({ schema: RelationshipTypeSchema }),
      description: State.SQLite.text({ nullable: true }),
      createdAt: State.SQLite.integer(),
      deletedAt: State.SQLite.integer({ nullable: true, schema: Schema.DateFromNumber }),
    },
  }),
}

// Define events
export const events = {
  // Book events
  bookCreated: Events.synced({
    name: 'v1.BookCreated',
    schema: Schema.Struct({
      id: Schema.String,
      title: Schema.String,
      author: Schema.NullOr(Schema.String),
      createdAt: Schema.Number,
    }),
  }),

  bookUpdated: Events.synced({
    name: 'v1.BookUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      title: Schema.optional(Schema.String),
      author: Schema.optional(Schema.NullOr(Schema.String)),
    }),
  }),

  bookDeleted: Events.synced({
    name: 'v1.BookDeleted',
    schema: Schema.Struct({
      id: Schema.String,
      deletedAt: Schema.Date,
    }),
  }),

  // Note events
  noteCreated: Events.synced({
    name: 'v1.NoteCreated',
    schema: Schema.Struct({
      id: Schema.String,
      bookId: Schema.String,
      type: NoteTypeSchema,
      title: Schema.String,
      content: Schema.NullOr(Schema.String),
      metadata: Schema.optional(Schema.NullOr(Schema.Unknown)),
      createdAt: Schema.Number,
      updatedAt: Schema.Number,
    }),
  }),

  noteUpdated: Events.synced({
    name: 'v1.NoteUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      type: Schema.optional(NoteTypeSchema),
      title: Schema.optional(Schema.String),
      content: Schema.optional(Schema.NullOr(Schema.String)),
      metadata: Schema.optional(Schema.NullOr(Schema.Unknown)),
      updatedAt: Schema.Number,
    }),
  }),

  noteDeleted: Events.synced({
    name: 'v1.NoteDeleted',
    schema: Schema.Struct({
      id: Schema.String,
      deletedAt: Schema.Date,
    }),
  }),

  // Relationship events
  relationshipCreated: Events.synced({
    name: 'v1.RelationshipCreated',
    schema: Schema.Struct({
      id: Schema.String,
      fromNoteId: Schema.String,
      toNoteId: Schema.String,
      relationshipType: RelationshipTypeSchema,
      description: Schema.NullOr(Schema.String),
      createdAt: Schema.Number,
    }),
  }),

  relationshipUpdated: Events.synced({
    name: 'v1.RelationshipUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      relationshipType: Schema.optional(RelationshipTypeSchema),
      description: Schema.optional(Schema.NullOr(Schema.String)),
    }),
  }),

  relationshipDeleted: Events.synced({
    name: 'v1.RelationshipDeleted',
    schema: Schema.Struct({
      id: Schema.String,
      deletedAt: Schema.Date,
    }),
  }),
}

// Define materializers for all events
const materializers = State.SQLite.materializers(events, {
  // Book materializers
  'v1.BookCreated': ({ id, title, author, createdAt }: { id: string; title: string; author: string | null; createdAt: number }) =>
    tables.books.insert({ id, title, author, createdAt }),

  'v1.BookUpdated': ({ id, title, author }: { id: string; title?: string; author?: string | null }) =>
    tables.books.update({ title, author }).where({ id }),

  'v1.BookDeleted': ({ id, deletedAt }: { id: string; deletedAt: Date }) =>
    tables.books.update({ deletedAt }).where({ id }),

  // Note materializers
  'v1.NoteCreated': ({ id, bookId, type, title, content, metadata, createdAt, updatedAt }: {
    id: string
    bookId: string
    type: 'character' | 'organization' | 'event' | 'location' | 'item' | 'concept'
    title: string
    content: string | null
    metadata?: unknown | null
    createdAt: number
    updatedAt: number
  }) =>
    tables.notes.insert({ id, bookId, type, title, content, metadata, createdAt, updatedAt }),

  'v1.NoteUpdated': ({ id, type, title, content, metadata, updatedAt }: {
    id: string
    type?: 'character' | 'organization' | 'event' | 'location' | 'item' | 'concept'
    title?: string
    content?: string | null
    metadata?: unknown | null
    updatedAt: number
  }) =>
    tables.notes.update({ type, title, content, metadata, updatedAt }).where({ id }),

  'v1.NoteDeleted': ({ id, deletedAt }: { id: string; deletedAt: Date }) =>
    tables.notes.update({ deletedAt }).where({ id }),

  // Relationship materializers
  'v1.RelationshipCreated': ({ id, fromNoteId, toNoteId, relationshipType, description, createdAt }: {
    id: string
    fromNoteId: string
    toNoteId: string
    relationshipType: 'impacts' | 'member_of' | 'ally' | 'enemy' | 'family' | 'friend' | 'owns' | 'located_in' | 'causes'
    description: string | null
    createdAt: number
  }) =>
    tables.noteRelationships.insert({ id, fromNoteId, toNoteId, relationshipType, description, createdAt }),

  'v1.RelationshipUpdated': ({ id, relationshipType, description }: {
    id: string
    relationshipType?: 'impacts' | 'member_of' | 'ally' | 'enemy' | 'family' | 'friend' | 'owns' | 'located_in' | 'causes'
    description?: string | null
  }) =>
    tables.noteRelationships.update({ relationshipType, description }).where({ id }),

  'v1.RelationshipDeleted': ({ id, deletedAt }: { id: string; deletedAt: Date }) =>
    tables.noteRelationships.update({ deletedAt }).where({ id }),
})

// Create the state
const state = State.SQLite.makeState({ tables, materializers })

// Create and export the final schema
export const schema = makeSchema({ events, state })

// Type exports
export type Book = typeof tables.books.Type
export type Note = typeof tables.notes.Type
export type NoteRelationship = typeof tables.noteRelationships.Type

// Export note and relationship type schemas for use in forms/validation
export type NoteType = 'character' | 'organization' | 'event' | 'location' | 'item' | 'concept'
export type RelationshipType = 'impacts' | 'member_of' | 'ally' | 'enemy' | 'family' | 'friend' | 'owns' | 'located_in' | 'causes'
