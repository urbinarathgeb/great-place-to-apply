import { uuid, varchar, text, integer, index, snakeCase } from "drizzle-orm/pg-core";
import { categories } from "@/db/schema/categories.schema";

export const companies = snakeCase.table("companies", {
	id: uuid().primaryKey().defaultRandom(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 100 }).unique().notNull(),
	website: text(),
	logoUrl: text(),
	categoryId: integer().references(() => categories.id).notNull(),
}, (table) => ({
	categoryIdx: index("companies_category_idx").on(table.categoryId),
}));
