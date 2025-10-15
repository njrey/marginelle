import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DRIZZLE, type Db } from "../db/db.module";
import { books } from "@marginelle/db/schema";
import { eq } from "drizzle-orm";
import { CreateBookDto } from "./books.controller";


@Injectable()
export class BooksService {
	constructor(@Inject(DRIZZLE) private db: Db) { }
	list() {
		return this.db.select().from(books);
	}

	async findOne(id: string) {
		const result = await this.db.select().from(books).where(eq(books.id, id));
		if (result.length === 0) {
			throw new NotFoundException(`Book with id ${id} not found`);
		}
		return result[0];
	}

	async create(createBookDto: CreateBookDto) {
		const newBook = {
			id: crypto.randomUUID(),
			title: createBookDto.title,
			author: createBookDto.author || null,
			createdAt: new Date()
		};

		const result = await this.db.insert(books).values(newBook).returning();
		return result[0];
	}
}
