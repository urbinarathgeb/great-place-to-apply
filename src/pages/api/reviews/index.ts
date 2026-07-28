import type { APIRoute } from "astro";
import { db } from "@/db";
import { reviews } from "@/db/schema/reviews.schema";
import { companies } from "@/db/schema/companies.schema";
import { stageReviews } from "@/db/schema/stage-reviews.schema";
import { aspectRating } from "@/db/schema/aspect-rating.schema";
import { createReviewSchema } from "@/lib/validations";
import { ilikeUnaccent } from "@/lib/search";
import { count, eq, and, sql } from "drizzle-orm";

export const GET: APIRoute = async ({ url }) => {
  try {
    const q = url.searchParams.get("q");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (q) {
      conditions.push(ilikeUnaccent(companies.name, `%${q}%`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: reviews.id,
        companyName: companies.name,
        companySlug: companies.slug,
        stagesCount: sql<number>`count(distinct ${stageReviews.id})::int`,
        ratingsCount: sql<number>`count(${aspectRating.id})::int`,
        avgScore: sql<string>`coalesce(avg(${aspectRating.score})::numeric(3,2), '0')`,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(companies, eq(reviews.companyId, companies.id))
      .leftJoin(stageReviews, eq(stageReviews.reviewId, reviews.id))
      .leftJoin(aspectRating, eq(aspectRating.stageReviewId, stageReviews.id))
      .where(where)
      .groupBy(reviews.id, companies.name, companies.slug, reviews.createdAt)
      .orderBy(sql`${reviews.createdAt} desc`)
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(reviews)
      .innerJoin(companies, eq(reviews.companyId, companies.id))
      .where(where);

    const totalPages = Math.ceil(total / limit);

    return new Response(
      JSON.stringify({ reviews: results, pagination: { page, limit, total, totalPages } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en GET /api/reviews:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Datos inválidos", details: parsed.error.issues }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const ipHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip)).then((h) => {
      return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
    });

    const result = await db.transaction(async (tx) => {
      const [review] = await tx
        .insert(reviews)
        .values({ companyId: parsed.data.companyId, ipHash })
        .returning({ id: reviews.id });

      for (const sr of parsed.data.stageReviews) {
        const [stageReview] = await tx
          .insert(stageReviews)
          .values({ reviewId: review.id, stageId: sr.stageId, comment: sr.comment })
          .returning({ id: stageReviews.id });

        for (const rating of sr.ratings) {
          await tx
            .insert(aspectRating)
            .values({ stageReviewId: stageReview.id, aspectName: rating.aspectName, score: rating.score.toString() });
        }
      }

      return review;
    });

    return new Response(
      JSON.stringify(result),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en POST /api/reviews:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
