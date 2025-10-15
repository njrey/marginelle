import { Module } from "@nestjs/common";
import { DbModule } from "./db/db.module";
import { BooksModule } from "./books/books.module";
import { NotesModule } from "./notes/notes.module";
import { RelationshipsModule } from "./relationships/relationships.module";
@Module({ imports: [DbModule, BooksModule, NotesModule, RelationshipsModule] })
export class AppModule { }
