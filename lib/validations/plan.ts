import { z } from "zod";
import { muscleGroupSchema } from "@/lib/validations/workout";

export const planKindSchema = z.enum([
  "STRENGTH",
  "CARDIO",
  "ACTIVE_RECOVERY",
  "MOBILITY",
  "REST",
  "CHECK_IN",
  "CUSTOM",
]);

export const recurrenceIntervalSchema = z.enum(["WEEKLY", "BIWEEKLY", "CUSTOM"]);

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a valid time.")
  .optional()
  .or(z.literal(""));

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.");

export const plannedExerciseInputSchema = z.object({
  exerciseId: z.string().min(1),
  targetSets: z.number().int().min(1).max(20).nullable().optional(),
  targetReps: z.number().int().min(1).max(200).nullable().optional(),
  targetWeight: z.number().min(0).max(2000).nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600).nullable().optional(),
  notes: z.string().trim().max(200).nullable().optional(),
});

export const upsertPlanSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().trim().min(1, "Give this workout a name.").max(80),
  date: dateSchema,
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  kind: planKindSchema,
  muscleGroups: z.array(muscleGroupSchema).default([]),
  notes: z.string().trim().max(1000).optional().nullable(),
  stepGoal: z.number().int().min(0).max(100000).nullable().optional(),
  cardioMinutes: z.number().min(0).max(600).nullable().optional(),
  exercises: z.array(plannedExerciseInputSchema).default([]),
  recurrence: z
    .object({
      interval: recurrenceIntervalSchema,
      intervalWeeks: z.number().int().min(1).max(8).optional(),
    })
    .optional()
    .nullable(),
  applyTo: z.enum(["one", "future"]).optional(),
});

export const planIdSchema = z.object({
  planId: z.string().min(1),
});

export const deletePlanSchema = z.object({
  planId: z.string().min(1),
  scope: z.enum(["one", "future"]).optional(),
});

export const movePlanSchema = z.object({
  planId: z.string().min(1),
  date: dateSchema,
});

export const applyTemplateSchema = z.object({
  templateId: z.string().min(1),
  date: dateSchema,
});

export const templateIdSchema = z.object({
  templateId: z.string().min(1),
});

export const saveTemplateSchema = z.object({
  planId: z.string().min(1),
  title: z.string().trim().max(80).optional(),
});

export const upsertRecurringSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(80),
  weekday: z.number().int().min(0).max(6),
  interval: recurrenceIntervalSchema,
  intervalWeeks: z.number().int().min(1).max(8).optional(),
  kind: planKindSchema,
  muscleGroups: z.array(muscleGroupSchema).default([]),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  templateId: z.string().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const deleteRecurringSchema = z.object({
  id: z.string().min(1),
  deleteFuture: z.boolean().optional(),
});

export const proposedDaySchema = z.object({
  date: dateSchema,
  title: z.string().trim().min(1).max(80),
  kind: planKindSchema,
  muscleGroups: z.array(muscleGroupSchema).default([]),
  startTime: timeSchema.optional(),
  notes: z.string().trim().max(500).optional().nullable(),
  exercises: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        targetSets: z.number().int().min(1).max(20).optional(),
        targetReps: z.number().int().min(1).max(200).optional(),
      })
    )
    .optional(),
});

export const applyProposedScheduleSchema = z.object({
  days: z.array(proposedDaySchema).min(1).max(14),
});

export const coachQuestionSchema = z.object({
  question: z.string().trim().min(2, "Ask a question.").max(500),
});

export const quickCreatePlanSchema = z.object({
  date: dateSchema,
  kind: z.enum(["REST", "CARDIO", "CHECK_IN"]),
  title: z.string().trim().max(80).optional(),
  cardioMinutes: z.number().min(0).max(600).optional(),
});

export const completeDaySchema = z.object({
  date: dateSchema,
});

