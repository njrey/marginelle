//import { defineMaterializer } from "@livestore/livestore";
//import { NoteRelationshipsTable } from "../models/relationships";
//import { RelationshipCreated, RelationshipDeleted } from "../events/relationship-events";
//
//// Materializer for RelationshipCreated event
//// Inserts a new relationship into the database
//export const relationshipCreatedMaterializer = defineMaterializer({
//  event: RelationshipCreated,
//  readModel: NoteRelationshipsTable,
//  materialize: ({ event, tx }) => {
//    tx.insert(NoteRelationshipsTable).values({
//      id: event.payload.id,
//      fromNoteId: event.payload.fromNoteId,
//      toNoteId: event.payload.toNoteId,
//      relationshipType: event.payload.relationshipType,
//      description: event.payload.description,
//      createdAt: event.payload.createdAt,
//    });
//  },
//});
//
//// Materializer for RelationshipDeleted event
//// Deletes a relationship from the database
//export const relationshipDeletedMaterializer = defineMaterializer({
//  event: RelationshipDeleted,
//  readModel: NoteRelationshipsTable,
//  materialize: ({ event, tx }) => {
//    tx.delete(NoteRelationshipsTable).where({ id: event.payload.id });
//  },
//});
