// src/lib/slug.ts
// Genera slugs válidos para URLs: "Banco de Chile" → "banco-de-chile"

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")                          // separar acentos: é → e + ́
    .replace(/[\u0300-\u036f]/g, "")           // eliminar acentos
    .replace(/[^a-z0-9]+/g, "-")               // reemplazar no-alfanuméricos con guión
    .replace(/^-+|-+$/g, "");                  // eliminar guiones al inicio/final
}
