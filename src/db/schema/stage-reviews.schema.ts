import { uuid, text, integer, snakeCase } from "drizzle-orm/pg-core";
import { reviews } from "@/db/schema/reviews.schema";
import { processStages } from "@/db/schema/process-stages.schema";

export const stageReviews = snakeCase.table("stage_reviews", {
	id: uuid().primaryKey().defaultRandom(),
	reviewId: uuid().references(() => reviews.id, { onDelete: "cascade" }).notNull(),
	stageId: integer().references(() => processStages.id).notNull(),
	comment: text().notNull(),
})
