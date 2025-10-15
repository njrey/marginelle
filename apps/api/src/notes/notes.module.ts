import { Module } from "@nestjs/common";
import { NotesController } from "./notes.controller";
import { NotesService } from "./notes.service";
import { DbModule } from "../db/db.module";

@Module({
	imports: [DbModule],
	controllers: [NotesController],
	providers: [NotesService],
	exports: [NotesService],
})
export class NotesModule { }
