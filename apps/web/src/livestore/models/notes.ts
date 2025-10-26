//import { Schema } from "@livestore/livestore";
//import { defineReadModel } from "@livestore/livestore";
//
//// Note types as Effect Schema literal union
//export const NoteTypeSchema = Schema.Literal(
//  "character",
//  "organization",
//  "event",
//  "location",
//  "item",
//  "concept"
//);
//
//export type NoteType = typeof NoteTypeSchema.Type;
//
//// Effect Schema for notes table
//export const NotesTable = defineReadModel({
//  name: "notes",
//  columns: {
//    id: Schema.String,
//    bookId: Schema.String, // foreign key to books
//    type: NoteTypeSchema,
//    title: Schema.String,
//    content: Schema.NullOr(Schema.String),
//    metadata: Schema.NullOr(Schema.Unknown), // JSON metadata
//    createdAt: Schema.Number, // timestamp in milliseconds
//    updatedAt: Schema.Number, // timestamp in milliseconds
//  },
//  primaryKey: "id",
//});
//
//// Type inference from the schema
//export type Note = typeof NotesTable.Type;
