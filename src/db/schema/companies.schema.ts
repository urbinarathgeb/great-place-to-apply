import { uuid, varchar, text, snakeCase } from "drizzle-orm/pg-core";

export const companies = snakeCase.table("companies", {
	id: uuid().primaryKey().defaultRandom(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 100 }).unique().notNull(),
	website: text(),
	logoUrl: text(),
});