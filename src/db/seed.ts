import { config } from "dotenv";
import { db } from "./index";
import { categories } from "./schema/categories.schema";
import { companies } from "./schema/companies.schema";
import { processStages } from "./schema/process-stages.schema";
import { reviews } from "./schema/reviews.schema";
import { stageReviews } from "./schema/stage-reviews.schema";
import { aspectRating } from "./schema/aspect-rating.schema";

config({ path: ".env.development" });

const seedCategories = [
  { name: "Minería", slug: "mineria" },
  { name: "Banca y Finanzas", slug: "banca" },
  { name: "Retail", slug: "retail" },
  { name: "Tecnología", slug: "tecnologia" },
  { name: "Aviación y Transporte", slug: "aviacion" },
  { name: "Alimentos y Bebidas", slug: "alimentos" },
  { name: "Telecomunicaciones", slug: "telecomunicaciones" },
  { name: "Consumo Masivo", slug: "consumo-masivo" },
  { name: "Energía", slug: "energia" },
  { name: "Salud", slug: "salud" },
  { name: "Consultoría", slug: "consultoria" },
  { name: "Manufactura", slug: "manufactura" },
];

const seedStages = [
  { name: "Postulación Enviada", slug: "postulacion" },
  { name: "Primera Entrevista (HR)", slug: "primera-entrevista" },
  { name: "Evaluación o Prueba Práctica", slug: "evaluacion" },
  { name: "Entrevista Final (Hiring Manager)", slug: "entrevista-final" },
  { name: "Oferta Laboral", slug: "oferta" },
  { name: "Proceso Finalizado", slug: "proceso-finalizado" },
];

const seedCompanies = [
  { name: "Antofagasta Minerals", slug: "antofagasta-minerals", categorySlug: "mineria" },
  { name: "Codelco", slug: "codelco", categorySlug: "mineria" },
  { name: "Anglo American", slug: "anglo-american", categorySlug: "mineria" },
  { name: "BHP", slug: "bhp", categorySlug: "mineria" },
  { name: "LATAM Airlines", slug: "latam-airlines", categorySlug: "aviacion" },
  { name: "Banco de Chile", slug: "banco-de-chile", categorySlug: "banca" },
  { name: "Banco Santander", slug: "banco-santander", categorySlug: "banca" },
  { name: "BCI", slug: "bci", categorySlug: "banca" },
  { name: "Mercado Libre", slug: "mercado-libre", categorySlug: "tecnologia" },
  { name: "Falabella", slug: "falabella", categorySlug: "retail" },
  { name: "Cencosud", slug: "cencosud", categorySlug: "retail" },
  { name: "Entel", slug: "entel", categorySlug: "telecomunicaciones" },
  { name: "Nestlé", slug: "nestle", categorySlug: "alimentos" },
  { name: "Coca-Cola", slug: "coca-cola", categorySlug: "alimentos" },
  { name: "CCU", slug: "ccu", categorySlug: "alimentos" },
  { name: "Procter & Gamble", slug: "procter-gamble", categorySlug: "consumo-masivo" },
  { name: "Sigdo Koppers", slug: "sigdo-koppers", categorySlug: "manufactura" },
  { name: "Viña Concha y Toro", slug: "concha-y-toro", categorySlug: "alimentos" },
  { name: "Sodimac", slug: "sodimac", categorySlug: "retail" },
  { name: "Microsoft Chile", slug: "microsoft-chile", categorySlug: "tecnologia" },
];

async function seed() {
  console.log("🌱 Seeding categories...");
  for (const cat of seedCategories) {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoNothing({ target: categories.slug });
  }

  console.log("🌱 Seeding process_stages...");
  for (const stage of seedStages) {
    await db
      .insert(processStages)
      .values(stage)
      .onConflictDoNothing({ target: processStages.slug });
  }

  console.log("🌱 Seeding companies...");
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map((c) => [c.slug, c.id]));

  for (const company of seedCompanies) {
    const categoryId = categoryMap.get(company.categorySlug);
    if (!categoryId) {
      console.warn(`⚠️  Category "${company.categorySlug}" not found, skipping ${company.name}`);
      continue;
    }
    await db
      .insert(companies)
      .values({ name: company.name, slug: company.slug, categoryId })
      .onConflictDoNothing({ target: companies.slug });
  }

  console.log("🌱 Seeding reviews...");
  const allCompanies = await db.select().from(companies);
  const allStages = await db.select().from(processStages);
  const companyBySlug = new Map(allCompanies.map((c) => [c.slug, c.id]));
  const stageBySlug = new Map(allStages.map((s) => [s.slug, s.id]));

  const seedReviews = [
    {
      companySlug: "latam-airlines",
      stages: [
        {
          stageSlug: "postulacion",
          comment: "Postulé por LinkedIn y en menos de 48 horas recibí respuesta. El proceso fue ágil y bien comunicado.",
          ratings: [
            { aspectName: "rapidez", score: "4.50" },
            { aspectName: "feedback", score: "3.00" },
          ],
        },
        {
          stageSlug: "primera-entrevista",
          comment: "Entrevista con HR muy agradable. Preguntas enfocadas en experiencia previa y motivaciones. Recibí feedback al día siguiente.",
          ratings: [
            { aspectName: "rapidez", score: "4.00" },
            { aspectName: "feedback", score: "3.50" },
            { aspectName: "trato", score: "5.00" },
          ],
        },
        {
          stageSlug: "evaluacion",
          comment: "Evaluación técnica bien estructurada. Me dieron una semana para completar un caso práctico. Recibí retroalimentación detallada.",
          ratings: [
            { aspectName: "rapidez", score: "3.00" },
            { aspectName: "feedback", score: "4.00" },
            { aspectName: "transparencia", score: "4.50" },
          ],
        },
      ],
    },
    {
      companySlug: "falabella",
      stages: [
        {
          stageSlug: "postulacion",
          comment: "Postulación a través de su portal web. Respondieron después de 2 semanas sin previo aviso. Proceso lento.",
          ratings: [
            { aspectName: "rapidez", score: "2.00" },
            { aspectName: "feedback", score: "1.50" },
            { aspectName: "transparencia", score: "2.00" },
          ],
        },
        {
          stageSlug: "primera-entrevista",
          comment: "La entrevista fue cordial pero sentí que no conocían mi perfil. Quedé en espera y nunca volvieron a contactarme.",
          ratings: [
            { aspectName: "rapidez", score: "2.50" },
            { aspectName: "feedback", score: "1.00" },
            { aspectName: "trato", score: "3.00" },
          ],
        },
      ],
    },
  ];

  for (const reviewData of seedReviews) {
    const companyId = companyBySlug.get(reviewData.companySlug);
    if (!companyId) {
      console.warn(`⚠️  Company "${reviewData.companySlug}" not found, skipping review`);
      continue;
    }

    await db.transaction(async (tx) => {
      const [review] = await tx
        .insert(reviews)
        .values({ companyId, ipHash: "seed" })
        .returning({ id: reviews.id });

      for (const sr of reviewData.stages) {
        const stageId = stageBySlug.get(sr.stageSlug);
        if (!stageId) {
          console.warn(`⚠️  Stage "${sr.stageSlug}" not found, skipping`);
          continue;
        }

        const [stageReview] = await tx
          .insert(stageReviews)
          .values({ reviewId: review.id, stageId, comment: sr.comment })
          .returning({ id: stageReviews.id });

        for (const r of sr.ratings) {
          await tx
            .insert(aspectRating)
            .values({ stageReviewId: stageReview.id, aspectName: r.aspectName, score: r.score });
        }
      }
    });
  }

  console.log("✅ Seed completado");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
