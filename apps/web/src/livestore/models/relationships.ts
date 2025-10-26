import { Schema } from "@livestore/livestore";
import { defineReadModel } from "@livestore/livestore";

// Relationship types as Effect Schema literal union
export const RelationshipTypeSchema = Schema.Literal(
  "impacts",
  "member_of",
  "ally",
  "enemy",
  "family",
  "friend",
  "owns",
  "located_in",
  "causes"
);

export type RelationshipType = typeof RelationshipTypeSchema.Type;

// Effect Schema for note_relationships table
export const NoteRelationshipsTable = defineReadModel({
  name: "note_relationships",
  columns: {
    id: Schema.String,
    fromNoteId: Schema.String, // foreign key to notes
    toNoteId: Schema.String, // foreign key to notes
    relationshipType: RelationshipTypeSchema,
    description: Schema.NullOr(Schema.String),
    createdAt: Schema.Number, // timestamp in milliseconds
  },
  primaryKey: "id",
});

// Type inference from the schema
export type NoteRelationship = typeof NoteRelationshipsTable.Type;
