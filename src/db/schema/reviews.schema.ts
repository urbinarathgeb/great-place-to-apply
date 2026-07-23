import { uuid, text, integer, varchar, timestamp, snakeCase } from 'drizzle-orm/pg-core'
import { companies } from "@/db/schema/companies.schema";
import { processStages } from "@/db/schema/process-stages.schema";

export const reviews = snakeCase.table('reviews', {
	id: uuid().primaryKey().defaultRandom(),
	companyId: uuid().references(() => companies.id).notNull(),
	stageId: integer().references(() => processStages.id).notNull(),
	comment: text().notNull(),
	ipHash: varchar({ length: 64 }),
	createdAt: timestamp().defaultNow().notNull(),
})