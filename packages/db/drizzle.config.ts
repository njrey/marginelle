import type { Config } from "drizzle-kit";

export default {
	schema: "./src/schema.ts",
	out: "./drizzle",
	dialect: "sqlite",
	dbCredentials: {
		// Path is relative to this config file; points to the Nest app DB file
		url: "../../apps/api/data/dev.db"
	},
	strict: true,
} satisfies Config;
