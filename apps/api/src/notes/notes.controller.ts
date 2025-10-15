import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from "@nestjs/common";
import { NotesService } from "./notes.service";

export class CreateNoteDto {
	type: string;
	title: string;
	content?: string;
	metadata?: Record<string, any>;
}

export class UpdateNoteDto {
	type?: string;
	title?: string;
	content?: string;
	metadata?: Record<string, any>;
}

@Controller("books/:bookId/notes")
export class NotesController {
	constructor(private svc: NotesService) { }

	@Get()
	list(@Param("bookId") bookId: string, @Query("type") type?: string) {
		return this.svc.listByBook(bookId, type);
	}

	@Get(":noteId")
	findOne(@Param("bookId") bookId: string, @Param("noteId") noteId: string) {
		return this.svc.findOne(bookId, noteId);
	}

	@Post()
	create(@Param("bookId") bookId: string, @Body() createNoteDto: CreateNoteDto) {
		return this.svc.create(bookId, createNoteDto);
	}

	@Patch(":noteId")
	update(
		@Param("bookId") bookId: string,
		@Param("noteId") noteId: string,
		@Body() updateNoteDto: UpdateNoteDto
	) {
		return this.svc.update(bookId, noteId, updateNoteDto);
	}

	@Delete(":noteId")
	delete(@Param("bookId") bookId: string, @Param("noteId") noteId: string) {
		return this.svc.delete(bookId, noteId);
	}
}
