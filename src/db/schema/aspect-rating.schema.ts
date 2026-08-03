import { pgEnum, serial, uuid, decimal, index, snakeCase } from "drizzle-orm/pg-core";
import { stageReviews } from "@/db/schema/stage-reviews.schema";

export const ASPECTS = ["rapidez", "feedback", "transparencia", "trato"] as const;

export const aspectNameEnum = pgEnum("aspect_name", ASPECTS);

export const aspectRating = snakeCase.table('aspect_rating', {
	id: serial().primaryKey(),
	stageReviewId: uuid().references(() => stageReviews.id).notNull(),
	aspectName: aspectNameEnum().notNull(),
	score: decimal({ precision: 3, scale: 2 }).notNull(),
}, (table) => ({
	stageReviewIdx: index("aspect_rating_stage_review_idx").on(table.stageReviewId),
}))
