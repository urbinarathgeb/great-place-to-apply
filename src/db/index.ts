import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

config({ path: '.env.development' });

const client = postgres(process.env.DATABASE_URL!, {
  max: import.meta.env.PROD ? 5 : 10,
});

export const db = drizzle({ client });
