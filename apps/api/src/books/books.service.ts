import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE, type Db } from "../db/db.module";
import { books } from "@marginelle/db/schema";
import { CreateBookDto } from "./books.controller";


@Injectable()
export class BooksService {
	constructor(@Inject(DRIZZLE) private db: Db) { }
	list() {
		return this.db.select().from(books);
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
