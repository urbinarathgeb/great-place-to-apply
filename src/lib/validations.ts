// src/lib/validations.ts
// Schemas de validación para los endpoints de la API
// Usamos Zod v4 para validar el body antes de tocar la DB

import { z } from "zod";

// Aspectos permitidos para las reseñas
const ALLOWED_ASPECTS = ["rapidez", "feedback", "transparencia", "trato"] as const;

// POST /api/companies
export const createCompanySchema = z.object({
  name: z.string().min(2, "Nombre muy corto").max(255),
  website: z.string().url("URL inválida").optional().nullable(),
  categoryId: z.number().int().positive("categoryId debe ser un número positivo"),
});

// POST /api/reviews
export const createReviewSchema = z.object({
  companyId: z.string().uuid("companyId debe ser un UUID válido"),
  comment: z.string().min(10, "El comentario debe tener al menos 10 caracteres").max(2000),
  stages: z.array(z.number().int().positive()).min(1, "Selecciona al menos una etapa"),
  ratings: z.array(z.object({
    aspectName: z.enum(ALLOWED_ASPECTS, { message: "Aspecto no válido" }),
    score: z.number().min(0, "Score mínimo es 0").max(5, "Score máximo es 5"),
  })).min(1, "Califica al menos un aspecto"),
});

// POST /api/stages
export const createStageSchema = z.object({
  name: z.string().min(3, "Nombre muy corto").max(150),
});

// POST /api/categories
export const createCategorySchema = z.object({
  name: z.string().min(3, "Nombre muy corto").max(100),
});
