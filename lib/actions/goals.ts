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
    await prisma.fitnessGoal.create({
      data: {
        userId: user.id,
        type: data.type,
        title: data.title,
        targetValue: data.targetValue,
        unit: data.unit,
        targetDate: data.targetDate ? fromInputDate(data.targetDate) : null,
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
      data: { completedAt: goal.completedAt ? null : new Date() },
    });
    revalidateStudio("/goals", "/dashboard", "/analytics");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to update that goal.") };
  }
}
