import { Schema } from "@livestore/livestore";
import { defineEvent } from "@livestore/livestore";
import { RelationshipTypeSchema } from "../models/relationships";

// Event: Relationship Created
export const RelationshipCreated = defineEvent({
  name: "RelationshipCreated",
  payload: Schema.Struct({
    id: Schema.String,
    fromNoteId: Schema.String,
    toNoteId: Schema.String,
    relationshipType: RelationshipTypeSchema,
    description: Schema.NullOr(Schema.String),
    createdAt: Schema.Number,
  }),
});

// Event: Relationship Deleted
export const RelationshipDeleted = defineEvent({
  name: "RelationshipDeleted",
  payload: Schema.Struct({
    id: Schema.String,
  }),
});

// Type exports for convenience
export type RelationshipCreatedPayload = typeof RelationshipCreated.PayloadType;
export type RelationshipDeletedPayload = typeof RelationshipDeleted.PayloadType;
