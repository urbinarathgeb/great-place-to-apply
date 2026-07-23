import { serial, uuid, varchar, decimal, snakeCase } from "drizzle-orm/pg-core";
import { reviews } from "@/db/schema/reviews.schema";

export const aspectRating = snakeCase.table('aspect_rating', {
	id: serial().primaryKey(),
	reviewId: uuid().references(() => reviews.id).notNull(),
	aspectName: varchar({ length: 50 }).notNull(),
	score: decimal({ precision: 3, scale: 2 }).notNull(),
})