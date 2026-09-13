import { prisma } from "@/lib/prisma";
import { fromInputDate, monthGrid, parseMonthKey, toDateOnly } from "@/lib/dates";
import { completionRatio } from "@/lib/calculations/progress";

export async function getMonthStudio(userId: string, month?: string) {
  const start = parseMonthKey(month);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const [workouts, nutrition, journals, weights] = await Promise.all([
    prisma.workout.findMany({
      where: {
        userId,
        date: { gte: start, lt: end },
        status: { in: ["COMPLETED", "IN_PROGRESS"] },
      },
      include: { exercises: true },
      orderBy: { date: "asc" },
    }),
    prisma.dailyNutrition.findMany({
      where: { userId, date: { gte: start, lt: end } },
    }),
    prisma.journalEntry.findMany({
      where: { userId, date: { gte: start, lt: end } },
    }),
    prisma.weightEntry.findMany({
      where: { userId, date: { gte: start, lt: end } },
    }),
  ]);

  const marks = new Map<
    string,
    { workout?: boolean; nutrition?: boolean; journal?: boolean; weight?: boolean }
  >();

  const stamp = (date: Date, key: "workout" | "nutrition" | "journal" | "weight") => {
    const id = date.toISOString().slice(0, 10);
    marks.set(id, { ...marks.get(id), [key]: true });
  };

  workouts.forEach((item) => stamp(item.date, "workout"));
  nutrition.forEach((item) => stamp(item.date, "nutrition"));
  journals.forEach((item) => stamp(item.date, "journal"));
  weights.forEach((item) => stamp(item.date, "weight"));

  return {
    start,
    cells: monthGrid(start),
    marks,
    workouts,
    nutrition,
    journals,
    weights,
  };
}

export async function getDayStudio(userId: string, day: string) {
  const date = fromInputDate(day);
  const [workouts, meals, journal, weight] = await Promise.all([
    prisma.workout.findMany({
      where: { userId, date, status: { in: ["COMPLETED", "IN_PROGRESS"] } },
      include: { exercises: { include: { exercise: true } } },
    }),
    prisma.nutritionEntry.findMany({
      where: { userId, date },
      orderBy: { createdAt: "asc" },
    }),
    prisma.journalEntry.findMany({
      where: { userId, date },
      orderBy: { createdAt: "desc" },
    }),
    prisma.weightEntry.findFirst({
      where: { userId, date },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { date, workouts, meals, journal, weight };
}

export async function getNutritionPage(userId: string) {
  const date = toDateOnly();
  const [meals, daily, recent] = await Promise.all([
    prisma.nutritionEntry.findMany({
      where: { userId, date },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dailyNutrition.findFirst({ where: { userId, date } }),
    prisma.dailyNutrition.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 8,
    }),
  ]);

  return { date, meals, daily, recent };
}

export async function getProgressPage(userId: string) {
  const [weights, measurements, steps] = await Promise.all([
    prisma.weightEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 16,
    }),
    prisma.bodyMeasurement.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 16,
    }),
    prisma.stepEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ]);

  return { weights, measurements, steps };
}

export type ExerciseTrendPoint = { date: Date; weight: number };

export type ExerciseTrend = {
  exerciseId: string;
  name: string;
  points: ExerciseTrendPoint[];
};

export async function getAnalyticsPage(userId: string) {
  const since = toDateOnly(new Date(Date.now() - 27 * 24 * 60 * 60 * 1000));
  const [workouts, weights, goals, loggedExercises] = await Promise.all([
    prisma.workout.findMany({
      where: { userId, status: "COMPLETED", date: { gte: since } },
      select: { id: true },
    }),
    prisma.weightEntry.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      take: 16,
    }),
    prisma.fitnessGoal.findMany({
      where: { userId, completedAt: null },
    }),
    prisma.workoutExercise.findMany({
      where: {
        workout: { userId, status: "COMPLETED" },
        sets: { some: { weight: { gt: 0 } } },
      },
      include: {
        exercise: true,
        sets: true,
        workout: { select: { date: true } },
      },
      orderBy: { workout: { date: "asc" } },
    }),
  ]);

  const trends = new Map<string, ExerciseTrend>();
  for (const row of loggedExercises) {
    const heaviest = Math.max(0, ...row.sets.map((set) => set.weight ?? 0));
    if (heaviest <= 0) continue;
    const current = trends.get(row.exerciseId) ?? {
      exerciseId: row.exerciseId,
      name: row.exercise.name,
      points: [],
    };
    current.points.push({ date: row.workout.date, weight: heaviest });
    trends.set(row.exerciseId, current);
  }

  return {
    workoutCount: workouts.length,
    weights,
    openGoals: goals.length,
    exercises: [...trends.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function getGoalsPage(userId: string) {
  const date = toDateOnly();
  const weekStart = new Date(date);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());

  const [goals, latestWeight, todayNutrition, todaySteps, weekWorkouts] =
    await Promise.all([
      prisma.fitnessGoal.findMany({
        where: { userId },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      }),
      prisma.weightEntry.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
      }),
      prisma.dailyNutrition.findFirst({ where: { userId, date } }),
      prisma.stepEntry.findFirst({ where: { userId, date } }),
      prisma.workout.count({
        where: {
          userId,
          status: "COMPLETED",
          date: { gte: weekStart },
        },
      }),
    ]);

  const decorated = goals.map((goal) => {
    let current: number | null = null;
    if (goal.type === "WEIGHT") current = latestWeight?.weight ?? null;
    if (goal.type === "PROTEIN") current = todayNutrition?.protein ?? 0;
    if (goal.type === "CALORIES") current = todayNutrition?.calories ?? 0;
    if (goal.type === "STEPS") current = todaySteps?.steps ?? 0;
    if (goal.type === "WORKOUT_FREQUENCY") current = weekWorkouts;

    return {
      ...goal,
      current,
      ratio:
        current != null && goal.targetValue
          ? completionRatio(current, goal.targetValue)
          : goal.completedAt
            ? 1
            : 0,
    };
  });

  return decorated;
}

export async function getJournalPage(userId: string) {
  return prisma.journalEntry.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 20,
  });
}
