import { Module } from "@nestjs/common";
import { DbModule } from "./db/db.module";
import { BooksModule } from "./books/books.module";
@Module({ imports: [DbModule, BooksModule] })
export class AppModule { }
