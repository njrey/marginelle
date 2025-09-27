import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE, type Db } from "../db/db.module";

import { books } from "@marginelle/db/schema";


@Injectable()
export class BooksService {
	constructor(@Inject(DRIZZLE) private db: Db) { }

	list() {
		const bookList = this.db.select().from(books);
	}
}
