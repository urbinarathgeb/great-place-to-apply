import { serial, varchar, snakeCase } from "drizzle-orm/pg-core";

export const processStages = snakeCase.table("process_stages", {
    id: serial().primaryKey(),
    name: varchar({ length: 100 }).notNull(),
});