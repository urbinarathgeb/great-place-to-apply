// ============================================
// GET /api/companies/:slug
// Detalle de empresa con reviews y estadísticas
// ============================================
//
// Ejemplos:
//   GET /api/companies/falabella
//   GET /api/companies/banco-de-chile
//
// Respuesta 200:
//   {
//     company: { id, name, slug, website, logoUrl, category: { name, slug } },
//     stats: { totalReviews, aspects: {...}, stages: [...] },
//     reviews: [{ id, comment, createdAt, stages: [...], ratings: {...} }]
//   }
//
// Errores:
//   404 — Empresa no encontrada
//   500 — Error interno del servidor

import type { APIRoute } from "astro";
import { db } from "@/db";
import { companies } from "@/db/schema/companies.schema";
import { categories } from "@/db/schema/categories.schema";
import { reviews } from "@/db/schema/reviews.schema";
import { reviewStages } from "@/db/schema/review-stages.schema";
import { processStages } from "@/db/schema/process-stages.schema";
import { aspectRating } from "@/db/schema/aspect-rating.schema";
import { eq, sql } from "drizzle-orm";

export const GET: APIRoute = async ({ params }) => {
  try {
    const slug = params.slug;

    // ── PASO 1: Buscar la empresa ────────────────────────────────
    // params.slug viene de [slug].ts → Astro infiere el valor de la URL
    // Ejemplo: /api/companies/falabella → params.slug = "falabella"

    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Slug requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const [company] = await db
      .select({
        id: companies.id,
        name: companies.name,
        slug: companies.slug,
        website: companies.website,
        logoUrl: companies.logoUrl,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(companies)
      .leftJoin(categories, eq(companies.categoryId, categories.id))
      .where(eq(companies.slug, slug))
      .limit(1);

    if (!company) {
      return new Response(
        JSON.stringify({ error: "Empresa no encontrada" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── PASO 2: Traer todas las reviews de esta empresa ──────────

    const companyReviews = await db
      .select({
        id: reviews.id,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(eq(reviews.companyId, company.id))
      .orderBy(reviews.createdAt);

    // ── PASO 3: Para cada review, traer sus stages y ratings ─────
    // Usamos Promise.all para ejecutar en paralelo (más rápido)

    const reviewsWithDetails = await Promise.all(
      companyReviews.map(async (review) => {
        // Stages de esta review
        const reviewStageResults = await db
          .select({ name: processStages.name })
          .from(reviewStages)
          .innerJoin(processStages, eq(reviewStages.stageId, processStages.id))
          .where(eq(reviewStages.reviewId, review.id));

        // Ratings de esta review
        const reviewRatings = await db
          .select({
            aspectName: aspectRating.aspectName,
            score: aspectRating.score,
          })
          .from(aspectRating)
          .where(eq(aspectRating.reviewId, review.id));

        // Convertir ratings a objeto: { rapidez: "4.50", feedback: "3.00" }
        const ratings: Record<string, string> = {};
        for (const r of reviewRatings) {
          ratings[r.aspectName] = r.score;
        }

        return {
          ...review,
          stages: reviewStageResults.map((s) => s.name),
          ratings,
        };
      })
    );

    // ── PASO 4: Calcular estadísticas agregadas ──────────────────
    // Promedio por aspecto usando SQL directo

    const aspectAverages = await db
      .select({
        aspectName: aspectRating.aspectName,
        avg: sql<string>`AVG(${aspectRating.score})::numeric(3,2)`,
      })
      .from(aspectRating)
      .innerJoin(reviews, eq(aspectRating.reviewId, reviews.id))
      .where(eq(reviews.companyId, company.id))
      .groupBy(aspectRating.aspectName);

    // Distribución de etapas (cuántas reviews pasaron por cada etapa)

    const stageDistribution = await db
      .select({
        name: processStages.name,
        count: sql<number>`count(*)::int`,
      })
      .from(reviewStages)
      .innerJoin(processStages, eq(reviewStages.stageId, processStages.id))
      .innerJoin(reviews, eq(reviewStages.reviewId, reviews.id))
      .where(eq(reviews.companyId, company.id))
      .groupBy(processStages.name)
      .orderBy(sql`count(*) desc`);

    // ── PASO 5: Armar la respuesta ──────────────────────────────

    const aspects: Record<string, number> = {};
    for (const a of aspectAverages) {
      aspects[a.aspectName] = parseFloat(a.avg);
    }

    return new Response(
      JSON.stringify({
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          website: company.website,
          logoUrl: company.logoUrl,
          category: { name: company.categoryName, slug: company.categorySlug },
        },
        stats: {
          totalReviews: companyReviews.length,
          aspects,
          stages: stageDistribution,
        },
        reviews: reviewsWithDetails,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en GET /api/companies/[slug]:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
