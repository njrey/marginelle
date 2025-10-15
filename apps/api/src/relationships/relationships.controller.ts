import { Controller, Get, Post, Delete, Body, Param } from "@nestjs/common";
import { RelationshipsService } from "./relationships.service";

export class CreateRelationshipDto {
	toNoteId: string;
	relationshipType: string;
	description?: string;
}

@Controller("books/:bookId/notes/:noteId/relationships")
export class RelationshipsController {
	constructor(private svc: RelationshipsService) { }

	@Get()
	list(@Param("bookId") bookId: string, @Param("noteId") noteId: string) {
		return this.svc.listByNote(bookId, noteId);
	}

	@Post()
	create(
		@Param("bookId") bookId: string,
		@Param("noteId") noteId: string,
		@Body() createRelationshipDto: CreateRelationshipDto
	) {
		return this.svc.create(bookId, noteId, createRelationshipDto);
	}

	@Delete(":relationshipId")
	delete(
		@Param("bookId") bookId: string,
		@Param("noteId") noteId: string,
		@Param("relationshipId") relationshipId: string
	) {
		return this.svc.delete(bookId, noteId, relationshipId);
	}
}
