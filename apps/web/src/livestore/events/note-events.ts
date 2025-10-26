import { Schema } from "@livestore/livestore";
import { defineEvent } from "@livestore/livestore";
import { NoteTypeSchema } from "../models/notes";

// Event: Note Created
export const NoteCreated = defineEvent({
  name: "NoteCreated",
  payload: Schema.Struct({
    id: Schema.String,
    bookId: Schema.String,
    type: NoteTypeSchema,
    title: Schema.String,
    content: Schema.NullOr(Schema.String),
    metadata: Schema.NullOr(Schema.Unknown),
    createdAt: Schema.Number,
    updatedAt: Schema.Number,
  }),
});

// Event: Note Updated
export const NoteUpdated = defineEvent({
  name: "NoteUpdated",
  payload: Schema.Struct({
    id: Schema.String,
    type: Schema.optional(NoteTypeSchema),
    title: Schema.optional(Schema.String),
    content: Schema.optional(Schema.NullOr(Schema.String)),
    metadata: Schema.optional(Schema.NullOr(Schema.Unknown)),
    updatedAt: Schema.Number,
  }),
});

// Event: Note Deleted
export const NoteDeleted = defineEvent({
  name: "NoteDeleted",
  payload: Schema.Struct({
    id: Schema.String,
  }),
});

// Type exports for convenience
export type NoteCreatedPayload = typeof NoteCreated.PayloadType;
export type NoteUpdatedPayload = typeof NoteUpdated.PayloadType;
export type NoteDeletedPayload = typeof NoteDeleted.PayloadType;
