import { z } from "zod";

export const updateSettingsSchema = z.object({
  weightUnit: z.enum(["LB", "KG"]),
  heightUnit: z.enum(["IN", "CM"]),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]),
  heightCm: z.coerce.number().min(80).max(250).optional().nullable(),
  activityLevel: z
    .enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"])
    .optional()
    .nullable(),
  experience: z.enum(["NEW", "RETURNING", "INTERMEDIATE", "ADVANCED"]).optional().nullable(),
  primaryGoalKind: z
    .enum(["FAT_LOSS", "WEIGHT_LOSS", "MAINTENANCE", "MUSCLE_GAIN", "RECOMPOSITION", "STRENGTH", "ENDURANCE"])
    .optional()
    .nullable(),
  targetWeight: z.coerce.number().min(1).max(1000).optional().nullable(),
  trainingFrequency: z.coerce.number().int().min(1).max(14).optional().nullable(),
  preferredDurationMin: z.coerce.number().int().min(10).max(240).optional().nullable(),
});
