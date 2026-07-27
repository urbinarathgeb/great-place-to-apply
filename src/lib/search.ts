// src/lib/search.ts
// Utilidades de búsqueda accent-insensitive para PostgreSQL
// Usa la extensión unaccent para ignorar tildes y acentos
//
// Ejemplo: unaccent('café') = unaccent('cafe') → TRUE
//
// Uso en endpoints:
//   import { ilikeUnaccent } from "@/lib/search";
//   .where(ilikeUnaccent(companies.name, `%${q}%`))

import { sql } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

export function ilikeUnaccent(column: AnyColumn, pattern: string) {
  return sql`unaccent(${column}) ILIKE unaccent(${pattern})`;
}
