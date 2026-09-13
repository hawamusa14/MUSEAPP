"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fromInputDate } from "@/lib/dates";
import { toActionError, type ActionResult } from "@/lib/errors";
import { revalidateStudio } from "@/lib/revalidate";
import {
  cardioSessionSchema,
  measurementSchema,
  progressCheckInSchema,
  stepEntrySchema,
  weightEntrySchema,
} from "@/lib/validations/studio";

export async function addWeightAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = weightEntrySchema.parse(input);
    await prisma.weightEntry.create({
      data: {
        userId: user.id,
        date: fromInputDate(data.date),
        weight: data.weight,
        unit: user.settings?.weightUnit ?? "LB",
        notes: data.notes,
      },
    });
    revalidateStudio("/progress", "/dashboard", "/analytics", "/calendar", "/goals");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to save that weight.") };
  }
}

export async function addMeasurementAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = measurementSchema.parse(input);
    await prisma.bodyMeasurement.create({
      data: {
        userId: user.id,
        date: fromInputDate(data.date),
        name: data.name,
        value: data.value,
        unit: data.unit,
      },
    });
    revalidateStudio("/progress", "/dashboard", "/analytics", "/calendar", "/goals");
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to save that measurement."),
    };
  }
}

export async function addStepsAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = stepEntrySchema.parse(input);
    const date = fromInputDate(data.date);
    await prisma.stepEntry.upsert({
      where: { userId_date: { userId: user.id, date } },
      create: { userId: user.id, date, steps: data.steps },
      update: { steps: data.steps },
    });
    revalidateStudio("/progress", "/dashboard", "/analytics", "/calendar", "/goals");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to save steps.") };
  }
}

export async function addCardioAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = cardioSessionSchema.parse(input);
    const date = fromInputDate(data.date);
    await prisma.cardioSession.create({
      data: {
        userId: user.id,
        date,
        type: data.type,
        durationMin: data.durationMin,
        calories: data.calories,
        notes: data.notes,
      },
    });
    revalidateStudio("/progress", "/dashboard", "/analytics", "/calendar", "/history");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to save that cardio session.") };
  }
}

export async function addProgressCheckInAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = progressCheckInSchema.parse(input);
    const date = fromInputDate(data.date);
    await prisma.progressPhoto.create({
      data: {
        userId: user.id,
        date,
        angle: data.angle,
        label: data.label || null,
        notes: data.notes || null,
        url: "logged://progress",
      },
    });
    revalidateStudio("/progress", "/dashboard", "/analytics", "/calendar", "/history");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to save that check-in.") };
  }
}
