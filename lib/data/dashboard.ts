import { prisma } from "@/lib/prisma";
import { dateKey, toDateOnly } from "@/lib/dates";
import { getActiveWorkout, getTodaysWorkout } from "@/lib/data/workouts";
import { getPlansForDate, serializePlan } from "@/lib/data/plans";

export async function getDashboardData(userId: string) {
  const date = toDateOnly();
  const tomorrow = new Date(date);
  tomorrow.setUTCDate(date.getUTCDate() + 1);
  const weekStart = new Date(date);
  const day = weekStart.getUTCDay();
  weekStart.setUTCDate(weekStart.getUTCDate() + (day === 0 ? -6 : 1 - day));

  const [activeWorkout, todaysWorkout, latestWeight, latestSteps, latestNutrition, todayPlans, tomorrowPlans, weekWorkouts, frequencyGoal] =
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
      getPlansForDate(userId, date),
      getPlansForDate(userId, tomorrow),
      prisma.workout.count({
        where: { userId, status: "COMPLETED", date: { gte: weekStart } },
      }),
      prisma.fitnessGoal.findFirst({
        where: { userId, type: "WORKOUT_FREQUENCY", completedAt: null },
      }),
    ]);

  return {
    activeWorkout,
    todaysWorkout,
    latestWeight,
    latestSteps,
    latestNutrition,
    todayPlans: todayPlans.map(serializePlan),
    tomorrowPlans: tomorrowPlans.map(serializePlan),
    weekWorkouts,
    workoutsTarget: frequencyGoal?.targetValue ?? null,
    todayKey: dateKey(date),
  };
}
