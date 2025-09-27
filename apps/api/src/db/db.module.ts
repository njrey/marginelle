import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@marginelle/db/schema"; // (or similar)


export const DRIZZLE = Symbol("DRIZZLE_DB");
export type Db = BetterSQLite3Database<typeof schema>;

@Global()
@Module({
	imports: [ConfigModule.forRoot({ isGlobal: true })],
	providers: [
		{
			provide: DRIZZLE,
			inject: [ConfigService],
			useFactory: (cfg: ConfigService): Db => {
				const dbPath = cfg.get<string>("DATABASE_SQLITE_PATH") ?? "./data/dev.db";
				const sqlite = new Database(dbPath);
				return drizzle(sqlite, { schema });
			},
		},
	],
	exports: [DRIZZLE],
})
export class DbModule { }
