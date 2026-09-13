import { prisma } from "@/lib/prisma";
import { dateKey, toDateOnly } from "@/lib/dates";
import { titleCaseName } from "@/lib/names";
import { getUpcomingPlans, serializePlan } from "@/lib/data/plans";
import type { CoachContext } from "@/lib/ai/scheduleCoach";

export async function buildAiContext(userId: string): Promise<CoachContext & {
  currentWeight: number | null;
  personalRecords: { exercise: string; type: string; value: number }[];
}> {
  const today = toDateOnly();
  const [user, latestWeight, recentWorkouts, latestRecords, upcoming, frequencyGoal, todayNutrition, todaySteps] =
    await Promise.all([
      prisma.user.findFirst({
        where: { id: userId },
        include: { profile: true, settings: true, fitnessGoals: true },
      }),
      prisma.weightEntry.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
      }),
      prisma.workout.findMany({
        where: { userId, status: "COMPLETED" },
        orderBy: { date: "desc" },
        take: 12,
        select: {
          title: true,
          date: true,
          durationSeconds: true,
          muscleGroups: true,
        },
      }),
      prisma.personalRecord.findMany({
        where: { userId },
        orderBy: { achievedAt: "desc" },
        take: 8,
        include: { exercise: true },
      }),
      getUpcomingPlans(userId, 16),
      prisma.fitnessGoal.findFirst({
        where: { userId, type: "WORKOUT_FREQUENCY", completedAt: null },
      }),
      prisma.dailyNutrition.findFirst({ where: { userId, date: today } }),
      prisma.stepEntry.findFirst({ where: { userId, date: today } }),
    ]);

  return {
    name: user?.name,
    currentWeight: latestWeight?.weight ?? null,
    goals: user?.fitnessGoals.map((goal) => goal.title) ?? [],
    recentWorkouts,
    upcoming: upcoming.map(serializePlan),
    today: dateKey(today),
    frequencyTarget: frequencyGoal?.targetValue ?? user?.profile?.trainingFrequency ?? null,
    activityLevel: user?.profile?.activityLevel ?? null,
    trainingFrequency: user?.profile?.trainingFrequency ?? null,
    todaySteps: todaySteps?.steps ?? null,
    todayProtein: todayNutrition?.protein ?? null,
    todayCalories: todayNutrition?.calories ?? null,
    personalRecords: latestRecords.map((record) => ({
      exercise: titleCaseName(record.exercise.name),
      type: record.type,
      value: record.value,
    })),
  };
}
