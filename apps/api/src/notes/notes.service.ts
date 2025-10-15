import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DRIZZLE, type Db } from "../db/db.module";
import { notes, noteRelationships } from "@marginelle/db/schema";
import { eq, and } from "drizzle-orm";
import { CreateNoteDto, UpdateNoteDto } from "./notes.controller";

@Injectable()
export class NotesService {
	constructor(@Inject(DRIZZLE) private db: Db) { }

	async listByBook(bookId: string, type?: string) {
		const conditions = type
			? and(eq(notes.bookId, bookId), eq(notes.type, type))
			: eq(notes.bookId, bookId);

		return this.db.select().from(notes).where(conditions);
	}

	async findOne(bookId: string, noteId: string) {
		const result = await this.db.query.notes.findFirst({
			where: and(eq(notes.id, noteId), eq(notes.bookId, bookId)),
			with: {
				relationshipsFrom: {
					with: { toNote: true }
				},
				relationshipsTo: {
					with: { fromNote: true }
				}
			}
		});

		if (!result) {
			throw new NotFoundException(`Note with id ${noteId} not found`);
		}

		return result;
	}

	async create(bookId: string, createNoteDto: CreateNoteDto) {
		const now = new Date();
		const newNote = {
			id: crypto.randomUUID(),
			bookId,
			type: createNoteDto.type,
			title: createNoteDto.title,
			content: createNoteDto.content || null,
			metadata: createNoteDto.metadata ? JSON.stringify(createNoteDto.metadata) : null,
			createdAt: now,
			updatedAt: now
		};

		const result = await this.db.insert(notes).values(newNote).returning();
		return result[0];
	}

	async update(bookId: string, noteId: string, updateNoteDto: UpdateNoteDto) {
		// First verify the note exists and belongs to the book
		await this.findOne(bookId, noteId);

		const updateData: any = {
			updatedAt: new Date()
		};

		if (updateNoteDto.title !== undefined) updateData.title = updateNoteDto.title;
		if (updateNoteDto.content !== undefined) updateData.content = updateNoteDto.content;
		if (updateNoteDto.type !== undefined) updateData.type = updateNoteDto.type;
		if (updateNoteDto.metadata !== undefined) {
			updateData.metadata = updateNoteDto.metadata ? JSON.stringify(updateNoteDto.metadata) : null;
		}

		const result = await this.db
			.update(notes)
			.set(updateData)
			.where(and(eq(notes.id, noteId), eq(notes.bookId, bookId)))
			.returning();

		return result[0];
	}

	async delete(bookId: string, noteId: string) {
		// First verify the note exists and belongs to the book
		await this.findOne(bookId, noteId);

		await this.db
			.delete(notes)
			.where(and(eq(notes.id, noteId), eq(notes.bookId, bookId)));

		return { success: true };
	}
}
