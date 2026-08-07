import type { APIRoute } from "astro";
import { db } from "@/db";
import { reviews } from "@/db/schema/reviews.schema";
import { companies } from "@/db/schema/companies.schema";
import { stageReviews } from "@/db/schema/stage-reviews.schema";
import { aspectRating } from "@/db/schema/aspect-rating.schema";
import { processStages } from "@/db/schema/process-stages.schema";
import { createReviewSchema } from "@/lib/validations";
import { ilikeUnaccent } from "@/lib/search";
import { eq, and, sql } from "drizzle-orm";

export const GET: APIRoute = async ({ url }) => {
  try {
    const q = url.searchParams.get("q");
    const companyId = url.searchParams.get("companyId");
    const stage = url.searchParams.get("stage");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (q) {
      conditions.push(ilikeUnaccent(companies.name, `%${q}%`));
    }

    if (companyId) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) {
        return new Response(
          JSON.stringify({ error: "companyId debe ser un UUID válido" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      conditions.push(eq(reviews.companyId, companyId));
    }

    if (stage) {
      conditions.push(eq(processStages.slug, stage));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: reviews.id,
        companyName: companies.name,
        companySlug: companies.slug,
        comment: reviews.comment,
        stagesCount: sql<number>`count(distinct ${stageReviews.id})::int`,
        ratingsCount: sql<number>`count(${aspectRating.id})::int`,
        avgScore: sql<string>`coalesce(avg(${aspectRating.score})::numeric(3,2), '0')`,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(companies, eq(reviews.companyId, companies.id))
      .leftJoin(stageReviews, eq(stageReviews.reviewId, reviews.id))
      .leftJoin(aspectRating, eq(aspectRating.stageReviewId, stageReviews.id))
      .leftJoin(processStages, eq(stageReviews.stageId, processStages.id))
      .where(where)
      .groupBy(reviews.id, reviews.comment, companies.name, companies.slug, reviews.createdAt)
      .orderBy(sql`${reviews.createdAt} desc`)
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(distinct ${reviews.id})::int` })
      .from(reviews)
      .innerJoin(companies, eq(reviews.companyId, companies.id))
      .leftJoin(stageReviews, eq(stageReviews.reviewId, reviews.id))
      .leftJoin(processStages, eq(stageReviews.stageId, processStages.id))
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

    const rawIp = request.headers.get("x-forwarded-for");
    const ip = rawIp ? rawIp.split(",")[0].trim() : "unknown";
    const ipHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip)).then((h) => {
      return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
    });

    // ── Anti-spam: cooldown por IP + empresa (30 días) ────────────
    const [cooldown] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.companyId, parsed.data.companyId), eq(reviews.ipHash, ipHash), sql`${reviews.createdAt} > now() - interval '30 days'`))
      .limit(1);

    if (cooldown) {
      return new Response(
        JSON.stringify({ error: "Ya escribiste una review para esta empresa hace menos de 30 días. ¡Gracias por tu feedback!" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Anti-spam: rate limit por IP (máx 1 review cada 5 min) ───
    const [recent] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.ipHash, ipHash), sql`${reviews.createdAt} > now() - interval '5 minutes'`))
      .limit(1);

    if (recent) {
      return new Response(
        JSON.stringify({ error: "Espera unos minutos antes de enviar otra review." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await db.transaction(async (tx) => {
      const [review] = await tx
        .insert(reviews)
        .values({ companyId: parsed.data.companyId, ipHash, role: parsed.data.role, recommends: parsed.data.recommends, comment: parsed.data.comment })
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
