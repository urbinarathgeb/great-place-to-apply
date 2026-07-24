import { config } from "dotenv";
import { db } from "./index";
import { categories } from "./schema/categories.schema";
import { companies } from "./schema/companies.schema";
import { processStages } from "./schema/process-stages.schema";

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

  console.log("✅ Seed completado");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
