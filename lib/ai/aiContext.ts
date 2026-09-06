import { prisma } from "@/lib/prisma";

export async function buildAiContext(userId: string) {
  const [user, latestWeight, recentWorkouts, latestRecords] = await Promise.all([
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
      take: 8,
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
  ]);

  return {
    name: user?.name,
    currentWeight: latestWeight?.weight ?? null,
    goals: user?.fitnessGoals.map((goal) => goal.title) ?? [],
    recentWorkouts,
    personalRecords: latestRecords.map((record) => ({
      exercise: record.exercise.name,
      type: record.type,
      value: record.value,
    })),
  };
}
