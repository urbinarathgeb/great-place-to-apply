// ============================================
// GET /api/companies
// Listado de empresas con búsqueda y paginación
// ============================================
//
// Ejemplos de uso:
//   GET /api/companies                        → todas las empresas (page 1, 20 resultados)
//   GET /api/companies?q=falabella            → busca por nombre (case-insensitive)
//   GET /api/companies?category=mineria       → filtra por categoría
//   GET /api/companies?page=2&limit=5         → paginación
//
// Respuesta JSON:
//   {
//     companies: [{ id, name, slug, logoUrl, categoryName, categorySlug }],
//     pagination: { page, limit, total, totalPages }
//   }

import type { APIRoute } from "astro";
import { db } from "@/db";
import { companies } from "@/db/schema/companies.schema";
import { categories } from "@/db/schema/categories.schema";
import { count, eq, and } from "drizzle-orm";
import { slugify } from "@/lib/slug";
import { createCompanySchema } from "@/lib/validations";
import { ilikeUnaccent } from "@/lib/search";

export const GET: APIRoute = async ({ url }) => {
  try {
    // ── PASO 1: Extraer query params ──────────────────────────────
    // url.searchParams es un objeto URLSearchParams nativo del browser/Node
    // .get("q") devuelve el valor del param "q" o null si no existe

    const q = url.searchParams.get("q");              // ?q=falabella → "falabella"
    const category = url.searchParams.get("category"); // ?category=mineria → "mineria"
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;                // calculamos el offset para SQL

    // ── PASO 2: Construir condiciones de filtro ───────────────────
    // Drizzle usa "conditions" como un array de expresiones SQL
    // Luego las combinamos con and() para crear el WHERE final

    const conditions = [];

    if (q) {
      // ilikeUnaccent = búsqueda case-insensitive + accent-insensitive
      // "banco de chilé" → "banco de chile" (sin tildes)
      conditions.push(ilikeUnaccent(companies.name, `%${q}%`));
    }
    if (category) {
      // eq = equals → WHERE categories.slug = 'mineria'
      conditions.push(eq(categories.slug, category));
    }

    // and(...conditions) une todo con AND. Si no hay condiciones, where = undefined (sin filtro)
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // ── PASO 3: Query principal ──────────────────────────────────
    // Drizzle construye la query de forma encadenada (method chaining)
    // Esto genera SQL como: SELECT id, name, slug... FROM companies LEFT JOIN categories...

    const results = await db
      .select({                          // qué columnas queremos (en vez de *)
        id: companies.id,
        name: companies.name,
        slug: companies.slug,
        logoUrl: companies.logoUrl,
        categoryName: categories.name,   // renombramos para evitar conflicto con companies.name
        categorySlug: categories.slug,
      })
      .from(companies)                   // FROM companies
      .leftJoin(categories,              // LEFT JOIN categories ON companies.category_id = categories.id
        eq(companies.categoryId, categories.id))
      .where(where)                      // WHERE (condiciones dinámicas, o nada)
      .orderBy(companies.name)           // ORDER BY name ASC
      .limit(limit)                      // LIMIT 20
      .offset(offset);                   // OFFSET 0

    // ── PASO 4: Contar total de resultados ───────────────────────
    // Necesitamos el total para calcular páginas
    // count() genera: SELECT COUNT(*) as total FROM companies...

    const [{ total }] = await db
      .select({ total: count() })        // count() = COUNT(*)
      .from(companies)
      .leftJoin(categories,
        eq(companies.categoryId, categories.id))
      .where(where);                     // misma condición que la query principal

    // ── PASO 5: Calcular paginación ─────────────────────────────

    const totalPages = Math.ceil(total / limit);  // 20 resultados / 20 por página = 1 página

    // ── PASO 6: Retornar respuesta ──────────────────────────────
    // new Response() es la Web API estándar (funciona en browser y Node)
    // Siempre debemos retornar un Response con status y headers

    return new Response(
      JSON.stringify({
        companies: results,
        pagination: { page, limit, total, totalPages },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // ── PASO 7: Manejo de errores ───────────────────────────────
    // Si algo falla (DB caída, query mal, etc.) retornamos 500
    // Nunca debemos dejar errores sin catch en un endpoint

    console.error("Error en GET /api/companies:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// ============================================
// POST /api/companies
// Crear una empresa nueva (contribución de usuarios)
// ============================================
//
// Body (JSON):
//   { "name": "Google Chile", "website": "https://google.cl", "categoryId": 4 }
//
// Respuesta 201:
//   { "id": "uuid", "name": "Google Chile", "slug": "google-chile" }
//
// Errores:
//   400 — Body inválido (validación Zod)
//   409 — La empresa ya existe (slug duplicado)
//   500 — Error interno del servidor

export const POST: APIRoute = async ({ request }) => {
  try {
    // ── PASO 1: Leer y validar el body ────────────────────────────
    // request.json() devuelve una promesa con el body parseado
    // createCompanySchema.safeParse() valida y devuelve { success, data, error }

    const body = await request.json();
    const parsed = createCompanySchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Datos inválidos", details: parsed.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { name, website, categoryId } = parsed.data;

    // ── PASO 2: Generar slug ─────────────────────────────────────
    // "Banco de Chile" → "banco-de-chile"

    const slug = slugify(name);

    // ── PASO 3: Verificar que no exista ──────────────────────────
    // Buscamos por slug. Si ya existe, retornamos 409 Conflict

    const [existing] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);

    if (existing) {
      return new Response(
        JSON.stringify({ error: "La empresa ya existe", slug }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── PASO 4: Insertar en la DB ────────────────────────────────
    // .values() recibe un objeto con los campos a insertar
    // .returning() retorna los campos insertados

    const [created] = await db
      .insert(companies)
      .values({ name, slug, website: website || null, categoryId })
      .returning({ id: companies.id, name: companies.name, slug: companies.slug });

    // ── PASO 5: Retornar respuesta ──────────────────────────────

    return new Response(
      JSON.stringify(created),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en POST /api/companies:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
