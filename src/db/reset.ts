// src/db/reset.ts
// Borra SOLO las reviews (y sus ratings asociados).
// El catálogo (empresas, categorías, etapas) queda intacto.
// Uso: pnpm db:reset:prod

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { db } from "./index";
import { reviews } from "./schema/reviews.schema";
import { stageReviews } from "./schema/stage-reviews.schema";
import { aspectRating } from "./schema/aspect-rating.schema";
import { printStats } from "./stats";

async function confirm(): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question("¿Borrar TODAS las reviews? Esto NO se puede deshacer. Escribe 'RESET' para confirmar: ");
  rl.close();
  return answer.trim().toUpperCase() === "RESET";
}

async function reset() {
  console.log("🗂️  Estado actual:");
  await printStats();

  if (!(await confirm())) {
    console.log("🛑 Cancelado. No se borró nada.");
    process.exit(0);
  }

  console.log("🧹 Borrando reviews...");
  await db.delete(aspectRating);
  await db.delete(stageReviews);
  await db.delete(reviews);
  console.log("✅ Reviews eliminadas (catálogo intacto).");

  console.log("\n🗂️  Estado final:");
  await printStats();
  process.exit(0);
}

reset().catch((err) => {
  console.error("❌ Error en reset:", err);
  process.exit(1);
});
