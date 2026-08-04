import { uuid, text, varchar, boolean, timestamp, index, snakeCase } from 'drizzle-orm/pg-core'
import { companies } from "@/db/schema/companies.schema";

export const reviews = snakeCase.table('reviews', {
	id: uuid().primaryKey().defaultRandom(),
	companyId: uuid().references(() => companies.id).notNull(),
	ipHash: varchar({ length: 64 }),
	role: varchar({ length: 150 }).notNull(),
	recommends: boolean().notNull(),
	comment: text().notNull(),
	createdAt: timestamp().defaultNow().notNull(),
}, (table) => ({
	companyCreatedIdx: index('reviews_company_created_idx').on(table.companyId, table.createdAt),
}))
