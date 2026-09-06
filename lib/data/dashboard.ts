import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/dates";
import { getActiveWorkout, getTodaysWorkout } from "@/lib/data/workouts";

export async function getDashboardData(userId: string) {
  const date = toDateOnly();
  const [activeWorkout, todaysWorkout, latestWeight, latestSteps, latestNutrition] =
    await Promise.all([
      getActiveWorkout(userId),
      getTodaysWorkout(userId),
      prisma.weightEntry.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
      }),
      prisma.stepEntry.findFirst({
        where: { userId, date },
      }),
      prisma.dailyNutrition.findFirst({
        where: { userId, date },
      }),
    ]);

  return {
    activeWorkout,
    todaysWorkout,
    latestWeight,
    latestSteps,
    latestNutrition,
  };
}
