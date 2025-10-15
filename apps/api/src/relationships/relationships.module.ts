import { Module } from "@nestjs/common";
import { RelationshipsController } from "./relationships.controller";
import { RelationshipsService } from "./relationships.service";
import { DbModule } from "../db/db.module";

@Module({
	imports: [DbModule],
	controllers: [RelationshipsController],
	providers: [RelationshipsService],
	exports: [RelationshipsService],
})
export class RelationshipsModule { }
