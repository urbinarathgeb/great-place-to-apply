import type { APIRoute } from "astro";
import { db } from "@/db";
import { reviews } from "@/db/schema/reviews.schema";
import { companies } from "@/db/schema/companies.schema";
import { stageReviews } from "@/db/schema/stage-reviews.schema";
import { processStages } from "@/db/schema/process-stages.schema";
import { aspectRating } from "@/db/schema/aspect-rating.schema";
import { eq } from "drizzle-orm";

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "ID requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const [review] = await db
      .select({
        id: reviews.id,
        companyName: companies.name,
        companySlug: companies.slug,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(companies, eq(reviews.companyId, companies.id))
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review) {
      return new Response(
        JSON.stringify({ error: "Review no encontrada" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const reviewStages = await db
      .select({
        id: stageReviews.id,
        name: processStages.name,
        comment: stageReviews.comment,
      })
      .from(stageReviews)
      .innerJoin(processStages, eq(stageReviews.stageId, processStages.id))
      .where(eq(stageReviews.reviewId, review.id));

    const stagesWithRatings = await Promise.all(
      reviewStages.map(async (sr) => {
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

    return new Response(
      JSON.stringify({ ...review, stages: stagesWithRatings }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en GET /api/reviews/[id]:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
