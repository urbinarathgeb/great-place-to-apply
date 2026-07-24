import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

config({ path: '.env.development' });

const client = postgres(process.env.DATABASE_URL!, {
  max: process.env.NODE_ENV === 'production' ? 5 : 10,
});

export const db = drizzle({ client });
