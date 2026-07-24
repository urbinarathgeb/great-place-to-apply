import { uuid, integer, primaryKey, snakeCase } from "drizzle-orm/pg-core";
import { reviews } from "@/db/schema/reviews.schema";
import { processStages } from "@/db/schema/process-stages.schema";

export const reviewStages = snakeCase.table("review_stages", {
	reviewId: uuid().references(() => reviews.id, { onDelete: "cascade" }).notNull(),
	stageId: integer().references(() => processStages.id).notNull(),
}, (t) => [
	primaryKey({ columns: [t.reviewId, t.stageId] }),
]);
