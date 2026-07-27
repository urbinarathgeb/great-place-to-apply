// src/db/setup.ts
// Ejecutar una sola vez después de crear la DB:
//   pnpm db:setup
//
// Habilita extensiones de PostgreSQL necesarias para la aplicación.

import { db } from "./index.js";
import { sql } from "drizzle-orm";

async function setup() {
  console.log("🔧 Habilitando extensión unaccent...");
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS unaccent`);
  console.log("✅ Extensión unaccent habilitada");
  process.exit(0);
}

setup().catch((err) => {
  console.error("❌ Error en setup:", err);
  process.exit(1);
});
