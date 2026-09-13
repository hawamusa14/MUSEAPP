"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fromInputDate } from "@/lib/dates";
import { toActionError, type ActionResult } from "@/lib/errors";
import { revalidateStudio } from "@/lib/revalidate";
import { completeGoalSchema, goalSchema } from "@/lib/validations/studio";

export async function addGoalAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = goalSchema.parse(input);
    const date = new Date();
    const today = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const weekStart = new Date(today);
    const weekday = weekStart.getUTCDay();
    weekStart.setUTCDate(weekStart.getUTCDate() + (weekday === 0 ? -6 : 1 - weekday));

    let startValue: number | null = null;
    if (data.type === "WEIGHT") {
      const latest = await prisma.weightEntry.findFirst({
        where: { userId: user.id },
        orderBy: { date: "desc" },
      });
      startValue = latest?.weight ?? null;
    } else if (data.type === "STEPS") {
      const latest = await prisma.stepEntry.findFirst({
        where: { userId: user.id, date: today },
      });
      startValue = latest?.steps ?? 0;
    } else if (data.type === "PROTEIN" || data.type === "CALORIES") {
      const daily = await prisma.dailyNutrition.findFirst({
        where: { userId: user.id, date: today },
      });
      startValue = data.type === "PROTEIN" ? daily?.protein ?? 0 : daily?.calories ?? 0;
    } else if (data.type === "WORKOUT_FREQUENCY") {
      startValue = await prisma.workout.count({
        where: { userId: user.id, status: "COMPLETED", date: { gte: weekStart } },
      });
    }

    await prisma.fitnessGoal.create({
      data: {
        userId: user.id,
        type: data.type,
        title: data.title,
        startValue,
        targetValue: data.targetValue,
        unit: data.unit,
        targetDate: data.targetDate ? fromInputDate(data.targetDate) : null,
        status: "ACTIVE",
      },
    });
    revalidateStudio("/goals", "/dashboard", "/analytics");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to save that goal.") };
  }
}

export async function completeGoalAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { goalId } = completeGoalSchema.parse(input);
    const goal = await prisma.fitnessGoal.findFirst({
      where: { id: goalId, userId: user.id },
    });
    if (!goal) {
      return { ok: false, error: "We could not find that goal." };
    }
    await prisma.fitnessGoal.update({
      where: { id: goal.id },
      data: goal.completedAt
        ? { completedAt: null, status: "ACTIVE" }
        : { completedAt: new Date(), status: "COMPLETED" },
    });
    revalidateStudio("/goals", "/dashboard", "/analytics");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to update that goal.") };
  }
}
