"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fromInputDate } from "@/lib/dates";
import { toActionError, type ActionResult } from "@/lib/errors";
import { revalidateStudio } from "@/lib/revalidate";
import { nutritionEntrySchema, waterSchema } from "@/lib/validations/studio";

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

  await prisma.dailyNutrition.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId,
      date,
      ...totals,
      waterMl: daily?.waterMl ?? 0,
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
        protein: data.protein ?? 0,
        carbs: data.carbs ?? 0,
        fat: data.fat ?? 0,
      },
    });

    await syncDaily(user.id, date);
    revalidateStudio("/nutrition", "/dashboard", "/calendar");
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

    await prisma.dailyNutrition.upsert({
      where: { userId_date: { userId: user.id, date } },
      create: {
        userId: user.id,
        date,
        waterMl: data.waterMl,
      },
      update: { waterMl: data.waterMl },
    });

    revalidateStudio("/nutrition", "/dashboard", "/calendar");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to save water.") };
  }
}
