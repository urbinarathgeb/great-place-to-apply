import { serial, varchar, snakeCase } from "drizzle-orm/pg-core";

export const categories = snakeCase.table("categories", {
	id: serial().primaryKey(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).unique().notNull(),
});
