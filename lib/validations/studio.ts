import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.");

export const nutritionEntrySchema = z.object({
  date: dateSchema,
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  foodName: z.string().trim().min(1, "Name the food.").max(80),
  calories: z.coerce.number().min(0).max(5000),
  protein: z.coerce.number().min(0).max(500).optional(),
  carbs: z.coerce.number().min(0).max(800).optional(),
  fat: z.coerce.number().min(0).max(400).optional(),
});

export const waterSchema = z.object({
  date: dateSchema,
  waterMl: z.coerce.number().min(0).max(20000),
});

export const weightEntrySchema = z.object({
  date: dateSchema,
  weight: z.coerce.number().min(1).max(1000),
  notes: z.string().trim().max(200).optional(),
});

export const measurementSchema = z.object({
  date: dateSchema,
  name: z.string().trim().min(1).max(40),
  value: z.coerce.number().min(0).max(400),
  unit: z.string().trim().min(1).max(12).default("in"),
});

export const stepEntrySchema = z.object({
  date: dateSchema,
  steps: z.coerce.number().int().min(0).max(200000),
});

export const goalSchema = z.object({
  type: z.enum([
    "WEIGHT",
    "STRENGTH",
    "STEPS",
    "WORKOUT_FREQUENCY",
    "PROTEIN",
    "CALORIES",
    "CUSTOM",
  ]),
  title: z.string().trim().min(2).max(80),
  targetValue: z.coerce.number().min(0).max(100000).optional(),
  unit: z.string().trim().max(20).optional(),
  targetDate: dateSchema.optional(),
});

export const completeGoalSchema = z.object({
  goalId: z.string().min(1),
});

export const journalSchema = z.object({
  date: dateSchema,
  entry: z.string().trim().min(1, "Write a few words.").max(4000),
  energy: z.coerce.number().int().min(1).max(10).optional(),
  sleep: z.coerce.number().int().min(1).max(10).optional(),
  recovery: z.coerce.number().int().min(1).max(10).optional(),
  stress: z.coerce.number().int().min(1).max(10).optional(),
  workoutNotes: z.string().trim().max(4000).optional(),
});

export const cardioSessionSchema = z.object({
  date: dateSchema,
  type: z.string().trim().min(1, "Name the activity.").max(40),
  durationMin: z.coerce.number().min(1).max(600),
  calories: z.coerce.number().int().min(0).max(5000).optional(),
  notes: z.string().trim().max(400).optional(),
});

export const progressCheckInSchema = z.object({
  date: dateSchema,
  angle: z.enum(["FRONT", "SIDE", "BACK", "CUSTOM"]),
  label: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(400).optional(),
});

