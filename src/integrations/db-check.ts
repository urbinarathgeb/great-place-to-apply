import type { AstroIntegration } from 'astro';
import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.development' });

export default function dbCheck(): AstroIntegration {
  return {
    name: 'db-check',
    hooks: {
      'astro:server:start': async () => {
        const url = process.env.DATABASE_URL;
        if (!url) {
          console.error('❌ DATABASE_URL no está definida');
          return;
        }
        try {
          const client = postgres(url, { max: 1 });
          await client`SELECT 1`;
          await client.end();
          console.log('✅ Conectado a PostgreSQL');
        } catch (err) {
          console.error(
            '❌ Error de conexión a PostgreSQL:',
            err instanceof Error ? err.message : err,
          );
        }
      },
    },
  };
}
