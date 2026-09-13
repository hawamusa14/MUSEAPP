import { z } from "zod";

export const muscleGroupSchema = z.enum([
  "UPPER_BODY",
  "LOWER_BODY",
  "CHEST",
  "BACK",
  "SHOULDERS",
  "ARMS",
  "BICEPS",
  "TRICEPS",
  "FOREARMS",
  "GLUTES",
  "QUADS",
  "HAMSTRINGS",
  "CALVES",
  "CORE",
  "FULL_BODY",
  "CARDIO",
  "MOBILITY",
]);

export const startWorkoutSchema = z.object({
  muscleGroups: z.array(muscleGroupSchema).min(1, "Choose at least one muscle group."),
  title: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.")
    .optional(),
});

export const workoutIdSchema = z.object({
  workoutId: z.string().min(1),
});

export const renameWorkoutSchema = z.object({
  workoutId: z.string().min(1),
  title: z.string().trim().min(1, "Give this workout a name.").max(80),
});

export const workoutCaloriesSchema = z.object({
  workoutId: z.string().min(1),
  calories: z.number().int().min(0).max(5000).nullable(),
});

const optionalAmount = (max: number, integer = false) =>
  z.preprocess((value) => {
    if (value === "" || value === undefined || value === null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, integer ? z.number().int().min(0).max(max).nullable() : z.number().min(0).max(max).nullable());

export const workoutCardioSchema = z.object({
  workoutId: z.string().min(1),
  cardioId: z.string().min(1).optional(),
  type: z.string().trim().min(1, "Choose a cardio activity.").max(40),
  durationMin: z.coerce.number().min(1, "Add the minutes.").max(600),
  distance: optionalAmount(200),
  distanceUnit: z.enum(["MI", "KM"]).optional(),
  calories: optionalAmount(5000, true),
});

export const workoutCardioIdSchema = z.object({
  workoutId: z.string().min(1),
  cardioId: z.string().min(1),
});

export const addExerciseSchema = z.object({
  workoutId: z.string().min(1),
  exerciseId: z.string().min(1),
});

export const createCustomExerciseSchema = z.object({
  workoutId: z.string().min(1),
  name: z.string().trim().min(2, "Give your exercise a name.").max(80),
  categoryId: z.string().min(1, "Choose a category."),
  equipment: z.string().trim().max(80).optional(),
});

export const searchExercisesSchema = z.object({
  query: z.string().trim().max(80).optional(),
  categoryId: z.string().optional(),
});

export const setIdSchema = z.object({
  setId: z.string().min(1),
});

export const addSetSchema = z.object({
  workoutExerciseId: z.string().min(1),
});

export const updateSetSchema = z.object({
  setId: z.string().min(1),
  weight: z.number().min(0).max(2000).nullable().optional(),
  reps: z.number().int().min(0).max(500).nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600).nullable().optional(),
  notes: z.string().trim().max(200).nullable().optional(),
  completed: z.boolean().optional(),
});

export const reorderSetSchema = z.object({
  setId: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

export const removeWorkoutExerciseSchema = z.object({
  workoutId: z.string().min(1),
  workoutExerciseId: z.string().min(1),
});

export const renameWorkoutExerciseSchema = z.object({
  workoutExerciseId: z.string().min(1),
  name: z.string().trim().min(1, "Give this exercise a name.").max(100),
});
