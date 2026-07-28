// ============================================
// GET /api/companies/:slug
// Detalle de empresa con reviews y estadísticas
// ============================================

import type { APIRoute } from "astro";
import { db } from "@/db";
import { companies } from "@/db/schema/companies.schema";
import { categories } from "@/db/schema/categories.schema";
import { reviews } from "@/db/schema/reviews.schema";
import { stageReviews } from "@/db/schema/stage-reviews.schema";
import { processStages } from "@/db/schema/process-stages.schema";
import { aspectRating } from "@/db/schema/aspect-rating.schema";
import { eq, sql } from "drizzle-orm";

export const GET: APIRoute = async ({ params }) => {
  try {
    const slug = params.slug;

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

    const companyReviews = await db
      .select({ id: reviews.id, createdAt: reviews.createdAt })
      .from(reviews)
      .where(eq(reviews.companyId, company.id))
      .orderBy(reviews.createdAt);

    const reviewsWithDetails = await Promise.all(
      companyReviews.map(async (review) => {
        const reviewStageResults = await db
          .select({
            id: stageReviews.id,
            name: processStages.name,
            comment: stageReviews.comment,
          })
          .from(stageReviews)
          .innerJoin(processStages, eq(stageReviews.stageId, processStages.id))
          .where(eq(stageReviews.reviewId, review.id));

        const stagesWithRatings = await Promise.all(
          reviewStageResults.map(async (sr) => {
            const ratings = await db
              .select({ aspectName: aspectRating.aspectName, score: aspectRating.score })
              .from(aspectRating)
              .where(eq(aspectRating.stageReviewId, sr.id));

            const ratingsObj: Record<string, string> = {};
            for (const r of ratings) {
              ratingsObj[r.aspectName] = r.score;
            }

            return { name: sr.name, comment: sr.comment, ratings: ratingsObj };
          })
        );

        return {
          id: review.id,
          createdAt: review.createdAt,
          stages: stagesWithRatings,
        };
      })
    );

    const aspectAverages = await db
      .select({
        aspectName: aspectRating.aspectName,
        avg: sql<string>`AVG(${aspectRating.score})::numeric(3,2)`,
      })
      .from(aspectRating)
      .innerJoin(stageReviews, eq(aspectRating.stageReviewId, stageReviews.id))
      .innerJoin(reviews, eq(stageReviews.reviewId, reviews.id))
      .where(eq(reviews.companyId, company.id))
      .groupBy(aspectRating.aspectName);

    const stageDistribution = await db
      .select({
        name: processStages.name,
        count: sql<number>`count(*)::int`,
      })
      .from(stageReviews)
      .innerJoin(processStages, eq(stageReviews.stageId, processStages.id))
      .innerJoin(reviews, eq(stageReviews.reviewId, reviews.id))
      .where(eq(reviews.companyId, company.id))
      .groupBy(processStages.name)
      .orderBy(sql`count(*) desc`);

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
