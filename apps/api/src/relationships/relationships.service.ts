import { Inject, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { DRIZZLE, type Db } from "../db/db.module";
import { noteRelationships, notes } from "@marginelle/db/schema";
import { eq, and, or } from "drizzle-orm";
import { CreateRelationshipDto } from "./relationships.controller";

@Injectable()
export class RelationshipsService {
	constructor(@Inject(DRIZZLE) private db: Db) { }

	async listByNote(bookId: string, noteId: string) {
		// First verify the note exists and belongs to the book
		const note = await this.db.query.notes.findFirst({
			where: and(eq(notes.id, noteId), eq(notes.bookId, bookId))
		});

		if (!note) {
			throw new NotFoundException(`Note with id ${noteId} not found`);
		}

		// Get all relationships where this note is involved
		return this.db.query.noteRelationships.findMany({
			where: or(
				eq(noteRelationships.fromNoteId, noteId),
				eq(noteRelationships.toNoteId, noteId)
			),
			with: {
				fromNote: true,
				toNote: true
			}
		});
	}

	async create(bookId: string, noteId: string, createRelationshipDto: CreateRelationshipDto) {
		// Verify the source note exists and belongs to the book
		const fromNote = await this.db.query.notes.findFirst({
			where: and(eq(notes.id, noteId), eq(notes.bookId, bookId))
		});

		if (!fromNote) {
			throw new NotFoundException(`Note with id ${noteId} not found`);
		}

		// Verify the target note exists and belongs to the same book
		const toNote = await this.db.query.notes.findFirst({
			where: and(eq(notes.id, createRelationshipDto.toNoteId), eq(notes.bookId, bookId))
		});

		if (!toNote) {
			throw new NotFoundException(`Target note with id ${createRelationshipDto.toNoteId} not found`);
		}

		// Prevent self-referencing relationships
		if (noteId === createRelationshipDto.toNoteId) {
			throw new BadRequestException("A note cannot have a relationship with itself");
		}

		const newRelationship = {
			id: crypto.randomUUID(),
			fromNoteId: noteId,
			toNoteId: createRelationshipDto.toNoteId,
			relationshipType: createRelationshipDto.relationshipType,
			description: createRelationshipDto.description || null,
			createdAt: new Date()
		};

		const result = await this.db.insert(noteRelationships).values(newRelationship).returning();
		return result[0];
	}

	async delete(bookId: string, noteId: string, relationshipId: string) {
		// Verify the relationship exists and involves the specified note
		const relationship = await this.db.query.noteRelationships.findFirst({
			where: and(
				eq(noteRelationships.id, relationshipId),
				or(
					eq(noteRelationships.fromNoteId, noteId),
					eq(noteRelationships.toNoteId, noteId)
				)
			),
			with: {
				fromNote: true,
				toNote: true
			}
		});

		if (!relationship) {
			throw new NotFoundException(`Relationship with id ${relationshipId} not found`);
		}

		// Verify the note belongs to the book
		if (relationship.fromNote.bookId !== bookId && relationship.toNote.bookId !== bookId) {
			throw new NotFoundException(`Relationship does not belong to book ${bookId}`);
		}

		await this.db
			.delete(noteRelationships)
			.where(eq(noteRelationships.id, relationshipId));

		return { success: true };
	}
}
