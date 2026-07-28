import { serial, uuid, varchar, decimal, snakeCase } from "drizzle-orm/pg-core";
import { stageReviews } from "@/db/schema/stage-reviews.schema";

export const aspectRating = snakeCase.table('aspect_rating', {
	id: serial().primaryKey(),
	stageReviewId: uuid().references(() => stageReviews.id).notNull(),
	aspectName: varchar({ length: 50 }).notNull(),
	score: decimal({ precision: 3, scale: 2 }).notNull(),
})
