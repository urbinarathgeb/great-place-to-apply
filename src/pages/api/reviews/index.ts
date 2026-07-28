import type { APIRoute } from "astro";
import { db } from "@/db";
import { reviews } from "@/db/schema/reviews.schema";
import { stageReviews } from "@/db/schema/stage-reviews.schema";
import { aspectRating } from "@/db/schema/aspect-rating.schema";
import { createReviewSchema } from "@/lib/validations";

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
