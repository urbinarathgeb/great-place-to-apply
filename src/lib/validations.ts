import { z } from "zod";

const ALLOWED_ASPECTS = ["rapidez", "feedback", "transparencia", "trato"] as const;

export const createCompanySchema = z.object({
  name: z.string().min(2, "Nombre muy corto").max(255),
  website: z.string().url("URL inválida").optional().nullable(),
  categoryId: z.number().int().positive("categoryId debe ser un número positivo"),
});

export const createReviewSchema = z.object({
  companyId: z.string().uuid("companyId debe ser un UUID válido"),
  comment: z.string().min(1, "El comentario general es requerido"),
  stageReviews: z.array(z.object({
    stageId: z.number().int().positive(),
    comment: z.string().min(10, "El comentario debe tener al menos 10 caracteres").max(2000),
    ratings: z.array(z.object({
      aspectName: z.enum(ALLOWED_ASPECTS, { message: "Aspecto no válido" }),
      score: z.number().min(0, "Score mínimo es 0").max(5, "Score máximo es 5"),
    })).min(1, "Califica al menos un aspecto"),
  })).min(1, "Agrega al menos una etapa"),
});

export const createStageSchema = z.object({
  name: z.string().min(3, "Nombre muy corto").max(150),
});

export const createCategorySchema = z.object({
  name: z.string().min(3, "Nombre muy corto").max(100),
});
