import { z } from "zod";
import { muscleGroupSchema } from "@/lib/validations/workout";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.");

export const parsedNoteSetSchema = z.object({
  weight: z.number().min(0).max(2000),
  reps: z.number().int().min(1).max(200),
  kind: z.enum(["warmup", "working"]),
  notes: z.string().trim().max(200).nullable().optional(),
});

export const parsedNoteExerciseSchema = z.object({
  name: z.string().trim().min(1).max(80),
  notes: z.string().trim().max(400).nullable().optional(),
  sets: z.array(parsedNoteSetSchema).min(1).max(20),
});

export const parsedNoteWorkoutSchema = z.object({
  date: dateSchema,
  title: z.string().trim().min(1).max(80),
  muscleGroups: z.array(muscleGroupSchema).min(1),
  exercises: z.array(parsedNoteExerciseSchema).min(1).max(40),
});

export const importNotesSchema = z.object({
  workouts: z.array(parsedNoteWorkoutSchema).min(1).max(40),
});
