import type { MuscleGroup, PlanKind, PlannedWorkout, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  dateKey,
  fromInputDate,
  monthGrid,
  monthKey,
  monthLabel,
  parseMonthKey,
  parseWeekKey,
  toDateOnly,
  toInputDate,
  weekDays,
  weekKey,
  weekLabel,
} from "@/lib/dates";
import {
  flattenPlannedSets,
  type CalendarHubDTO,
  type DayDetailDTO,
  type DayMarkDTO,
  type PlanDTO,
  type RecurringDTO,
  type TemplateDTO,
} from "@/lib/planning";

const planInclude = {
  exercises: {
    orderBy: { order: "asc" as const },
    include: {
      exercise: true,
      sets: { orderBy: { order: "asc" as const } },
    },
  },
  workout: { select: { id: true, status: true } },
} satisfies Prisma.PlannedWorkoutInclude;

type PlanRecord = Prisma.PlannedWorkoutGetPayload<{ include: typeof planInclude }>;

export function serializePlan(plan: PlanRecord): PlanDTO {
  return {
    id: plan.id,
    title: plan.title,
    date: dateKey(plan.date),
    startTime: plan.startTime,
    endTime: plan.endTime,
    kind: plan.kind,
    muscleGroups: plan.muscleGroups,
    notes: plan.notes,
    stepGoal: plan.stepGoal,
    cardioMinutes: plan.cardioMinutes,
    status: plan.status,
    workoutId: plan.workout?.id ?? null,
    workoutStatus: plan.workout?.status ?? null,
    templateId: plan.templateId,
    recurrenceId: plan.scheduleId,
    exercises: plan.exercises.map((item) => {
      const targets = flattenPlannedSets(item.sets);
      return {
        id: item.id,
        exerciseId: item.exerciseId,
        name: item.exercise.name,
        order: item.order,
        targetSets: targets.targetSets,
        targetReps: targets.targetReps,
        targetWeight: targets.targetWeight,
        restSeconds: targets.restSeconds,
        notes: item.notes,
      };
    }),
  };
}

export async function getPlannedWorkoutForUser(userId: string, planId: string) {
  return prisma.plannedWorkout.findFirst({
    where: { id: planId, userId },
    include: planInclude,
  });
}

export async function getUpcomingPlans(userId: string, take = 14) {
  return prisma.plannedWorkout.findMany({
    where: {
      userId,
      date: { gte: toDateOnly() },
      status: "PLANNED",
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take,
    include: planInclude,
  });
}

export async function getPlansForDate(userId: string, date: Date) {
  return prisma.plannedWorkout.findMany({
    where: { userId, date },
    orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
    include: planInclude,
  });
}

export async function getTemplatesForUser(userId: string): Promise<TemplateDTO[]> {
  const templates = await prisma.workoutTemplate.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: {
          exercise: true,
          sets: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  return templates.map((template) => ({
    id: template.id,
    title: template.title,
    kind: template.kind,
    muscleGroups: template.muscleGroups,
    notes: template.notes,
    exercises: template.exercises.map((item) => {
      const targets = flattenPlannedSets(item.sets);
      return {
        id: item.id,
        exerciseId: item.exerciseId,
        name: item.exercise.name,
        order: item.order,
        targetSets: targets.targetSets,
        targetReps: targets.targetReps,
        targetWeight: targets.targetWeight,
        restSeconds: targets.restSeconds,
        notes: item.notes,
      };
    }),
  }));
}

export async function getRecurringForUser(userId: string): Promise<RecurringDTO[]> {
  const rows = await prisma.workoutSchedule.findMany({
    where: { userId },
    orderBy: [{ weekday: "asc" }, { createdAt: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    weekday: row.weekday,
    interval: row.interval,
    intervalWeeks: row.intervalWeeks,
    kind: row.kind,
    muscleGroups: row.muscleGroups,
    startTime: row.startTime,
    endTime: row.endTime,
    isActive: row.isActive,
  }));
}

function emptyMark(date: string): DayMarkDTO {
  return {
    date,
    plans: [],
    workoutTitles: [],
    hasCompletedWorkout: false,
    hasPlanned: false,
    hasRest: false,
    hasCardio: false,
    hasNutrition: false,
    hasPhoto: false,
    steps: null,
    activeCalories: null,
    calories: null,
    protein: null,
  };
}

export async function ensureUpcomingRecurring(userId: string) {
  const recurrences = await prisma.workoutSchedule.findMany({
    where: { userId, isActive: true },
    include: {
      template: {
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { sets: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });

  for (const recurrence of recurrences) {
    const existing = await prisma.plannedWorkout.findMany({
      where: { userId, scheduleId: recurrence.id, date: { gte: toDateOnly() } },
      select: { date: true },
    });
    const existingKeys = new Set(existing.map((item) => dateKey(item.date)));
    const intervalWeeks = Math.max(1, recurrence.intervalWeeks || (recurrence.interval === "BIWEEKLY" ? 2 : 1));
    const cursor = new Date(toDateOnly());
    while (cursor.getUTCDay() !== recurrence.weekday) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    for (let index = 0; index < 8; index += 1) {
      const key = dateKey(cursor);
      if (!existingKeys.has(key)) {
        const templateExercises = recurrence.template?.exercises ?? [];
        await prisma.plannedWorkout.create({
          data: {
            userId,
            title: recurrence.title,
            date: new Date(cursor),
            startTime: recurrence.startTime,
            endTime: recurrence.endTime,
            kind: recurrence.kind,
            muscleGroups: recurrence.muscleGroups,
            templateId: recurrence.templateId,
            scheduleId: recurrence.id,
            exercises: {
              create: templateExercises.map((item, order) => ({
                exerciseId: item.exerciseId,
                order,
                sets: {
                  create: item.sets.map((set) => ({
                    order: set.order,
                    targetWeight: set.targetWeight,
                    targetReps: set.targetReps,
                    restSeconds: set.restSeconds,
                  })),
                },
              })),
            },
          },
        });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 7 * intervalWeeks);
    }
  }
}

export async function getDayHub(userId: string, day: string): Promise<DayDetailDTO> {
  const date = fromInputDate(day);
  const [plans, workouts, daily, journal, steps, cardio, photos, settings] =
    await Promise.all([
      prisma.plannedWorkout.findMany({
        where: { userId, date },
        orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
        include: planInclude,
      }),
      prisma.workout.findMany({
        where: { userId, date, status: { in: ["COMPLETED", "IN_PROGRESS"] } },
        include: { exercises: true },
      }),
      prisma.dailyNutrition.findFirst({ where: { userId, date } }),
      prisma.journalEntry.findMany({
        where: { userId, date },
        orderBy: { createdAt: "desc" },
      }),
      prisma.stepEntry.findFirst({ where: { userId, date } }),
      prisma.cardioSession.findMany({ where: { userId, date } }),
      prisma.progressPhoto.count({ where: { userId, date } }),
      prisma.userSettings.findUnique({ where: { userId } }),
    ]);

  const notes = [
    ...plans.map((plan) => plan.notes).filter(Boolean),
    ...journal.flatMap((item) => [item.entry, item.workoutNotes].filter(Boolean)),
  ] as string[];

  return {
    date: day,
    plans: plans.map(serializePlan),
    workouts: workouts.map((workout) => ({
      id: workout.id,
      title: workout.title,
      status: workout.status,
      exerciseCount: workout.exercises.length,
    })),
    steps: steps?.steps ?? null,
    stepGoal: settings?.stepGoal ?? 8000,
    activeCalories: steps?.calories ?? cardio.reduce((sum, item) => sum + (item.calories ?? 0), 0) || null,
    cardio: cardio.map((item) => ({ type: item.type, durationMin: item.durationMin })),
    nutrition: daily
      ? {
          calories: daily.calories,
          protein: daily.protein,
          carbs: daily.carbs,
          fat: daily.fat,
        }
      : null,
    calorieTarget: daily?.calorieTarget ?? settings?.calorieTarget ?? null,
    proteinTarget: daily?.proteinTarget ?? settings?.proteinTarget ?? null,
    carbsTarget: daily?.carbsTarget ?? settings?.carbsTarget ?? null,
    fatTarget: daily?.fatTarget ?? settings?.fatTarget ?? null,
    notes,
    photoCount: photos,
  };
}

export async function getCalendarHub(
  userId: string,
  input: { month?: string; week?: string; day?: string; view?: string }
): Promise<CalendarHubDTO> {
  await ensureUpcomingRecurring(userId);

  const view = input.view === "week" ? "week" : "month";
  const monthStart = parseMonthKey(input.month);
  const weekStart = parseWeekKey(input.week ?? input.day);
  const selectedDay = input.day ?? toInputDate();
  const cells = monthGrid(monthStart);
  const firstCell = cells.find(Boolean) ?? monthStart;
  const lastCell =
    [...cells].reverse().find(Boolean) ??
    new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0));
  const rangeStart = view === "week" ? weekStart : firstCell;
  const rangeEnd = new Date(view === "week" ? weekStart : lastCell);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + (view === "week" ? 7 : 1));

  const today = toDateOnly();
  const weekAnchor = startOfCurrentWeek(today);

  const [
    plans,
    workouts,
    nutrition,
    steps,
    cardio,
    photos,
    templates,
    recurrences,
    day,
    settings,
    frequencyGoal,
    weekWorkouts,
    todaySteps,
    todayNutrition,
  ] = await Promise.all([
    prisma.plannedWorkout.findMany({
      where: { userId, date: { gte: rangeStart, lt: rangeEnd } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: planInclude,
    }),
    prisma.workout.findMany({
      where: {
        userId,
        date: { gte: rangeStart, lt: rangeEnd },
        status: { in: ["COMPLETED", "IN_PROGRESS"] },
      },
    }),
    prisma.dailyNutrition.findMany({
      where: { userId, date: { gte: rangeStart, lt: rangeEnd } },
    }),
    prisma.stepEntry.findMany({
      where: { userId, date: { gte: rangeStart, lt: rangeEnd } },
    }),
    prisma.cardioSession.findMany({
      where: { userId, date: { gte: rangeStart, lt: rangeEnd } },
    }),
    prisma.progressPhoto.findMany({
      where: { userId, date: { gte: rangeStart, lt: rangeEnd } },
      select: { date: true },
    }),
    getTemplatesForUser(userId),
    getRecurringForUser(userId),
    getDayHub(userId, selectedDay),
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.fitnessGoal.findFirst({
      where: { userId, type: "WORKOUT_FREQUENCY", completedAt: null },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    }),
    prisma.workout.count({
      where: { userId, status: "COMPLETED", date: { gte: weekAnchor } },
    }),
    prisma.stepEntry.findFirst({ where: { userId, date: today } }),
    prisma.dailyNutrition.findFirst({ where: { userId, date: today } }),
  ]);

  const marks: Record<string, DayMarkDTO> = {};
  const stamp = (date: Date) => {
    const key = dateKey(date);
    marks[key] = marks[key] ?? emptyMark(key);
    return marks[key];
  };

  for (const plan of plans) {
    const mark = stamp(plan.date);
    const dto = serializePlan(plan);
    mark.plans.push(dto);
    if (plan.status === "PLANNED") mark.hasPlanned = true;
    if (plan.kind === "REST") mark.hasRest = true;
    if (plan.kind === "CARDIO") mark.hasCardio = true;
  }

  for (const workout of workouts) {
    const mark = stamp(workout.date);
    mark.workoutTitles.push(workout.title);
    if (workout.status === "COMPLETED") mark.hasCompletedWorkout = true;
  }

  for (const item of nutrition) {
    const mark = stamp(item.date);
    mark.hasNutrition = true;
    mark.calories = item.calories;
    mark.protein = item.protein;
  }

  for (const item of steps) {
    const mark = stamp(item.date);
    mark.steps = item.steps;
    mark.activeCalories = item.calories ?? mark.activeCalories;
  }

  for (const item of cardio) {
    const mark = stamp(item.date);
    mark.hasCardio = true;
    mark.activeCalories = (mark.activeCalories ?? 0) + (item.calories ?? 0);
  }

  for (const item of photos) {
    stamp(item.date).hasPhoto = true;
  }

  return {
    view,
    month: monthKey(monthStart),
    week: weekKey(weekStart),
    selectedDay,
    monthLabel: monthLabel(monthStart),
    weekLabel: weekLabel(weekStart),
    monthCells: cells.map((cell) => (cell ? dateKey(cell) : null)),
    weekDays: weekDays(weekStart).map(dateKey),
    marks,
    day,
    templates,
    recurrences,
    goals: {
      workoutsDone: weekWorkouts,
      workoutsTarget: frequencyGoal?.targetValue ?? null,
      steps: todaySteps?.steps ?? 0,
      stepGoal: settings?.stepGoal ?? 8000,
      protein: todayNutrition?.protein ?? 0,
      proteinTarget:
        settings?.proteinTarget ??
        (frequencyGoal?.type === "PROTEIN" ? frequencyGoal.targetValue : null),
    },
    today: dateKey(today),
  };
}

function startOfCurrentWeek(value: Date) {
  const date = new Date(value);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

export type { PlannedWorkout, PlanKind, MuscleGroup };
