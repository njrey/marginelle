import { Events, makeSchema, Schema, State } from '@livestore/livestore'

// Define books table
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
}

// Define book events
export const events = {
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
}

// Define materializers for book events
const materializers = State.SQLite.materializers(events, {
  'v1.BookCreated': ({ id, title, author, createdAt }: { id: string; title: string; author: string | null; createdAt: number }) =>
    tables.books.insert({ id, title, author, createdAt }),

  'v1.BookUpdated': ({ id, title, author }: { id: string; title?: string; author?: string | null }) =>
    tables.books.update({ title, author }).where({ id }),

  'v1.BookDeleted': ({ id, deletedAt }: { id: string; deletedAt: Date }) =>
    tables.books.update({ deletedAt }).where({ id }),
})

// Create the state
const state = State.SQLite.makeState({ tables, materializers })

// Create and export the final schema
export const schema = makeSchema({ events, state })

// Type export for books
export type Book = typeof tables.books.Type
