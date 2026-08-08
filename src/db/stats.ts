import { sql } from "drizzle-orm";
import { db } from "./index";
import { categories } from "./schema/categories.schema";
import { companies } from "./schema/companies.schema";
import { processStages } from "./schema/process-stages.schema";
import { reviews } from "./schema/reviews.schema";
import { stageReviews } from "./schema/stage-reviews.schema";
import { aspectRating } from "./schema/aspect-rating.schema";

export async function printStats() {
  const [cats, comps, stages, revs, stageRevs, ratings] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(categories),
    db.select({ n: sql<number>`count(*)` }).from(companies),
    db.select({ n: sql<number>`count(*)` }).from(processStages),
    db.select({ n: sql<number>`count(*)` }).from(reviews),
    db.select({ n: sql<number>`count(*)` }).from(stageReviews),
    db.select({ n: sql<number>`count(*)` }).from(aspectRating),
  ]);

  const [withCareers] = await db
    .select({ n: sql<number>`count(*)` })
    .from(companies)
    .where(sql`careers_url is not null`);

  console.log("📊 Resumen de la base de datos");
  console.log("─────────────────────────────");
  console.log(`Empresas:        ${comps[0].n}`);
  console.log(`  · con careers: ${withCareers.n}`);
  console.log(`Categorías:      ${cats[0].n}`);
  console.log(`Etapas:          ${stages[0].n}`);
  console.log(`Reviews:         ${revs[0].n}`);
  console.log(`Stage reviews:   ${stageRevs[0].n}`);
  console.log(`Ratings:         ${ratings[0].n}`);

  return {
    companies: comps[0].n,
    withCareers: withCareers.n,
    categories: cats[0].n,
    stages: stages[0].n,
    reviews: revs[0].n,
    stageReviews: stageRevs[0].n,
    ratings: ratings[0].n,
  };
}

async function main() {
  try {
    await printStats();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error obteniendo estadísticas:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
