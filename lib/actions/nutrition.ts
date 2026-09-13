"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fromInputDate } from "@/lib/dates";
import { ActionError, toActionError, type ActionResult } from "@/lib/errors";
import { revalidateStudio } from "@/lib/revalidate";
import {
  logSavedMealSchema,
  nutritionEntryIdSchema,
  nutritionEntrySchema,
  savedMealIdSchema,
  savedMealSchema,
  updateNutritionEntrySchema,
  waterSchema,
} from "@/lib/validations/studio";

async function nutritionTargets(userId: string) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  return {
    calorieTarget: settings?.calorieTarget ?? null,
    proteinTarget: settings?.proteinTarget ?? null,
    carbsTarget: settings?.carbsTarget ?? null,
    fatTarget: settings?.fatTarget ?? null,
  };
}

async function syncDaily(userId: string, date: Date) {
  const entries = await prisma.nutritionEntry.findMany({ where: { userId, date } });
  const daily = await prisma.dailyNutrition.findFirst({ where: { userId, date } });
  const totals = entries.reduce(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      protein: sum.protein + item.protein,
      carbs: sum.carbs + item.carbs,
      fat: sum.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const targets = daily ? {} : await nutritionTargets(userId);

  await prisma.dailyNutrition.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId,
      date,
      ...totals,
      waterMl: daily?.waterMl ?? 0,
      ...targets,
    },
    update: totals,
  });
}

export async function addNutritionEntryAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = nutritionEntrySchema.parse(input);
    const date = fromInputDate(data.date);

    await prisma.nutritionEntry.create({
      data: {
        userId: user.id,
        date,
        mealType: data.mealType,
        foodName: data.foodName,
        calories: data.calories,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
      },
    });

    if (data.saveAsPreset) {
      await prisma.savedMeal.create({
        data: {
          userId: user.id,
          name: data.foodName,
          mealType: data.mealType,
          calories: data.calories,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
        },
      });
    }

    await syncDaily(user.id, date);
    revalidateStudio("/nutrition", "/dashboard", "/calendar", "/history");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to save that meal.") };
  }
}

export async function saveWaterAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = waterSchema.parse(input);
    const date = fromInputDate(data.date);

    const existing = await prisma.dailyNutrition.findFirst({
      where: { userId: user.id, date },
    });
    const targets = existing ? {} : await nutritionTargets(user.id);
    await prisma.dailyNutrition.upsert({
      where: { userId_date: { userId: user.id, date } },
      create: {
        userId: user.id,
        date,
        waterMl: data.waterMl,
        ...targets,
      },
      update: { waterMl: data.waterMl },
    });

    revalidateStudio("/nutrition", "/dashboard", "/calendar");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to save water.") };
  }
}

export async function updateNutritionEntryAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = updateNutritionEntrySchema.parse(input);
    const existing = await prisma.nutritionEntry.findFirst({
      where: { id: data.entryId, userId: user.id },
    });
    if (!existing) throw new ActionError("That meal is no longer available.");

    const nextDate = fromInputDate(data.date);
    await prisma.nutritionEntry.update({
      where: { id: existing.id },
      data: {
        date: nextDate,
        mealType: data.mealType,
        foodName: data.foodName,
        calories: data.calories,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
      },
    });

    await syncDaily(user.id, existing.date);
    if (existing.date.getTime() !== nextDate.getTime()) {
      await syncDaily(user.id, nextDate);
    }
    revalidateStudio("/nutrition", "/dashboard", "/calendar", "/history");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to update that meal.") };
  }
}

export async function deleteNutritionEntryAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { entryId } = nutritionEntryIdSchema.parse(input);
    const existing = await prisma.nutritionEntry.findFirst({
      where: { id: entryId, userId: user.id },
    });
    if (!existing) throw new ActionError("That meal is no longer available.");

    await prisma.nutritionEntry.delete({ where: { id: existing.id } });
    await syncDaily(user.id, existing.date);
    revalidateStudio("/nutrition", "/dashboard", "/calendar", "/history");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to remove that meal.") };
  }
}

export async function upsertSavedMealAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = savedMealSchema.parse(input);
    const payload = {
      name: data.name,
      mealType: data.mealType,
      calories: data.calories,
      protein: data.protein || 0,
      carbs: data.carbs || 0,
      fat: data.fat || 0,
    };
    if (data.id) {
      const existing = await prisma.savedMeal.findFirst({
        where: { id: data.id, userId: user.id },
      });
      if (!existing) throw new ActionError("That saved meal is no longer available.");
      await prisma.savedMeal.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.savedMeal.create({
        data: { userId: user.id, ...payload },
      });
    }
    revalidateStudio("/nutrition", "/calendar");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to save that meal.") };
  }
}

export async function deleteSavedMealAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { savedMealId } = savedMealIdSchema.parse(input);
    await prisma.savedMeal.deleteMany({
      where: { id: savedMealId, userId: user.id },
    });
    revalidateStudio("/nutrition", "/calendar");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to remove that saved meal.") };
  }
}

export async function logSavedMealAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = logSavedMealSchema.parse(input);
    const saved = await prisma.savedMeal.findFirst({
      where: { id: data.savedMealId, userId: user.id },
    });
    if (!saved) throw new ActionError("That saved meal is no longer available.");

    const date = fromInputDate(data.date);
    await prisma.nutritionEntry.create({
      data: {
        userId: user.id,
        date,
        mealType: data.mealType || saved.mealType,
        foodName: saved.name,
        calories: saved.calories,
        protein: saved.protein,
        carbs: saved.carbs,
        fat: saved.fat,
      },
    });
    await syncDaily(user.id, date);
    revalidateStudio("/nutrition", "/dashboard", "/calendar", "/history");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to log that saved meal.") };
  }
}

