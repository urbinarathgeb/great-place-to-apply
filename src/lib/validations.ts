import { z } from "zod";
import { ASPECTS } from "@/db/schema/aspect-rating.schema";

const ALLOWED_ASPECTS = ASPECTS;

export const createCompanySchema = z.object({
  name: z.string().min(2, "Nombre muy corto").max(255),
  website: z.string().url("URL inválida").optional().nullable(),
  careersUrl: z.string().url("URL inválida").optional().nullable(),
  description: z.string().max(2000, "Descripción muy larga").optional().nullable(),
  location: z.string().max(255, "Ubicación muy larga").optional().nullable(),
  categoryId: z.number().int().positive("categoryId debe ser un número positivo"),
});

export const createReviewSchema = z.object({
  companyId: z.string().uuid("companyId debe ser un UUID válido"),
  role: z.string().min(1, "El rol o puesto es requerido").max(150, "Rol muy largo"),
  recommends: z.boolean({ message: "Indica si recomendarías la empresa" }),
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
