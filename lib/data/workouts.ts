import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/dates";
import { formatLoad, progressionHint } from "@/lib/calculations/strength";

export const workoutDetailInclude = {
  exercises: {
    orderBy: { order: "asc" as const },
    include: {
      exercise: {
        include: { category: true },
      },
      sets: {
        orderBy: { order: "asc" as const },
      },
    },
  },
  cardioSessions: {
    orderBy: { createdAt: "asc" as const },
  },
};

export async function getWorkoutForUser(userId: string, workoutId: string) {
  return prisma.workout.findFirst({
    where: { id: workoutId, userId },
    include: workoutDetailInclude,
  });
}

export async function getActiveWorkout(userId: string) {
  return prisma.workout.findFirst({
    where: { userId, status: "IN_PROGRESS", date: toDateOnly() },
    include: workoutDetailInclude,
  });
}

export async function getOpenLoggedWorkouts(userId: string) {
  return prisma.workout.findMany({
    where: {
      userId,
      status: "IN_PROGRESS",
      date: { lt: toDateOnly() },
    },
    orderBy: { date: "desc" },
    include: workoutDetailInclude,
  });
}

export async function getWorkoutHistory(userId: string, take = 40) {
  return prisma.workout.findMany({
    where: { userId, status: { in: ["COMPLETED", "IN_PROGRESS"] } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take,
    include: {
      exercises: {
        include: {
          exercise: true,
          sets: true,
        },
      },
    },
  });
}

export async function getRecentWorkouts(userId: string, take = 8) {
  return prisma.workout.findMany({
    where: { userId, status: "COMPLETED" },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take,
    include: {
      exercises: {
        include: {
          exercise: true,
          sets: true,
        },
      },
    },
  });
}

export async function getTodaysWorkout(userId: string) {
  const date = toDateOnly();
  return prisma.workout.findFirst({
    where: {
      userId,
      date,
      status: { in: ["IN_PROGRESS", "COMPLETED"] },
    },
    orderBy: { createdAt: "desc" },
    include: workoutDetailInclude,
  });
}

export async function getLastPerformance(
  userId: string,
  exerciseId: string,
  excludeWorkoutId?: string
) {
  return prisma.workoutExercise.findFirst({
    where: {
      exerciseId,
      workout: {
        userId,
        status: "COMPLETED",
        ...(excludeWorkoutId ? { id: { not: excludeWorkoutId } } : {}),
      },
    },
    orderBy: [{ workout: { date: "desc" } }, { createdAt: "desc" }],
    include: {
      sets: { orderBy: { order: "asc" } },
      workout: true,
    },
  });
}

export async function getLastPerformanceMap(
  userId: string,
  exerciseIds: string[],
  excludeWorkoutId?: string,
  unit: "LB" | "KG" = "LB"
) {
  const uniqueIds = [...new Set(exerciseIds)];
  const entries = await Promise.all(
    uniqueIds.map(async (exerciseId) => {
      const last = await getLastPerformance(userId, exerciseId, excludeWorkoutId);
      if (!last) {
        return [exerciseId, null] as const;
      }

      const bestSet = [...last.sets].reverse().find((set) => set.weight || set.reps);
      const unitLabel = unit === "KG" ? "kg" : "lb";

      return [
        exerciseId,
        {
          date: last.workout.date,
          summary: last.sets
            .map((set) => formatLoad(set.weight, set.reps, unitLabel))
            .join(" · "),
          hint: progressionHint(bestSet?.weight, bestSet?.reps, unit),
        },
      ] as const;
    })
  );

  return Object.fromEntries(entries);
}

