import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const books = sqliteTable("books", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	author: text("author"),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
