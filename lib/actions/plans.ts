"use server";

import type { MuscleGroup, PlanKind, RecurrenceInterval } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dateKey, fromInputDate, isPastDate, toDateOnly } from "@/lib/dates";
import { ActionError, toActionError, type ActionResult } from "@/lib/errors";
import { titleFromMuscleGroups } from "@/lib/muscle-groups";
import { revalidateStudio } from "@/lib/revalidate";
import { canStartPlannedWorkout, expandPlannedSets } from "@/lib/planning";
import {
  applyProposedScheduleSchema,
  applyTemplateSchema,
  completeDaySchema,
  deletePlanSchema,
  deleteRecurringSchema,
  movePlanSchema,
  planIdSchema,
  quickCreatePlanSchema,
  saveTemplateSchema,
  saveWorkoutTemplateSchema,
  templateIdSchema,
  upsertPlanSchema,
  upsertRecurringSchema,
} from "@/lib/validations/plan";

function refreshPlans(workoutId?: string) {
  revalidateStudio(
    "/calendar",
    "/dashboard",
    "/workout",
    "/history",
    "/analytics",
    "/ai-coach",
    "/goals",
    ...(workoutId ? [`/workout/${workoutId}`] : [])
  );
}

function intervalWeeksOf(interval: RecurrenceInterval, weeks?: number) {
  if (interval === "BIWEEKLY") return 2;
  if (interval === "CUSTOM") return Math.max(1, weeks ?? 1);
  return 1;
}

async function ownedPlan(userId: string, planId: string) {
  const plan = await prisma.plannedWorkout.findFirst({
    where: { id: planId, userId },
    include: {
      workout: { select: { id: true, status: true } },
      exercises: {
        orderBy: { order: "asc" },
        include: { sets: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!plan) throw new ActionError("We could not find that planned workout.");
  return plan;
}

function plannedExerciseCreates(
  exercises: {
    exerciseId: string;
    targetSets?: number | null;
    targetReps?: number | null;
    targetWeight?: number | null;
    restSeconds?: number | null;
    notes?: string | null;
  }[]
) {
  return exercises.map((item, order) => ({
    exerciseId: item.exerciseId,
    order,
    notes: item.notes ?? null,
    sets: {
      create: expandPlannedSets(item),
    },
  }));
}

async function replaceExercises(
  planId: string,
  exercises: {
    exerciseId: string;
    targetSets?: number | null;
    targetReps?: number | null;
    targetWeight?: number | null;
    restSeconds?: number | null;
    notes?: string | null;
  }[]
) {
  await prisma.plannedWorkoutExercise.deleteMany({ where: { plannedWorkoutId: planId } });
  for (const item of plannedExerciseCreates(exercises)) {
    await prisma.plannedWorkoutExercise.create({
      data: { plannedWorkoutId: planId, ...item },
    });
  }
}

export async function upsertPlanAction(input: unknown): Promise<ActionResult<{ planId: string }>> {
  try {
    const user = await requireUser();
    const data = upsertPlanSchema.parse(input);
    const date = fromInputDate(data.date);
    const startTime = data.startTime || null;
    const endTime = data.endTime || null;
    const payload = {
      title: data.title,
      date,
      startTime,
      endTime,
      kind: data.kind as PlanKind,
      muscleGroups: data.muscleGroups as MuscleGroup[],
      notes: data.notes || null,
      stepGoal: data.stepGoal ?? null,
      cardioMinutes: data.cardioMinutes ?? null,
    };

    let planId = data.id;

    if (data.id) {
      const existing = await ownedPlan(user.id, data.id);
      await prisma.plannedWorkout.update({
        where: { id: existing.id },
        data: payload,
      });
      await replaceExercises(existing.id, data.exercises);
      planId = existing.id;

      if (data.applyTo === "future" && existing.scheduleId) {
        const future = await prisma.plannedWorkout.findMany({
          where: {
            userId: user.id,
            scheduleId: existing.scheduleId,
            date: { gt: existing.date },
            status: "PLANNED",
          },
        });
        for (const item of future) {
          await prisma.plannedWorkout.update({
            where: { id: item.id },
            data: {
              title: payload.title,
              startTime: payload.startTime,
              endTime: payload.endTime,
              kind: payload.kind,
              muscleGroups: payload.muscleGroups,
              notes: payload.notes,
              stepGoal: payload.stepGoal,
              cardioMinutes: payload.cardioMinutes,
            },
          });
          await replaceExercises(item.id, data.exercises);
        }
        await prisma.workoutSchedule.update({
          where: { id: existing.scheduleId },
          data: {
            title: payload.title,
            kind: payload.kind,
            muscleGroups: payload.muscleGroups,
            startTime: payload.startTime,
            endTime: payload.endTime,
          },
        });
      }
    } else {
      const created = await prisma.plannedWorkout.create({
        data: {
          userId: user.id,
          ...payload,
          exercises: {
            create: plannedExerciseCreates(data.exercises),
          },
        },
      });
      planId = created.id;

      if (data.recurrence) {
        const intervalWeeks = intervalWeeksOf(data.recurrence.interval, data.recurrence.intervalWeeks);
        const recurrence = await prisma.workoutSchedule.create({
          data: {
            userId: user.id,
            title: payload.title,
            weekday: date.getUTCDay(),
            interval: data.recurrence.interval,
            intervalWeeks,
            kind: payload.kind,
            muscleGroups: payload.muscleGroups,
            startTime: payload.startTime,
            endTime: payload.endTime,
          },
        });
        await prisma.plannedWorkout.update({
          where: { id: created.id },
          data: { scheduleId: recurrence.id },
        });
        const cursor = new Date(date);
        cursor.setUTCDate(cursor.getUTCDate() + 7 * intervalWeeks);
        for (let index = 0; index < 7; index += 1) {
          await prisma.plannedWorkout.create({
            data: {
              userId: user.id,
              title: payload.title,
              date: new Date(cursor),
              startTime: payload.startTime,
              endTime: payload.endTime,
              kind: payload.kind,
              muscleGroups: payload.muscleGroups,
              notes: payload.notes,
              stepGoal: payload.stepGoal,
              cardioMinutes: payload.cardioMinutes,
              scheduleId: recurrence.id,
              exercises: {
                create: plannedExerciseCreates(data.exercises),
              },
            },
          });
          cursor.setUTCDate(cursor.getUTCDate() + 7 * intervalWeeks);
        }
      }
    }

    refreshPlans();
    return { ok: true, data: { planId: planId! } };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to save that planned workout."),
    };
  }
}

export async function deletePlanAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = deletePlanSchema.parse(input);
    const plan = await ownedPlan(user.id, data.planId);

    if (data.scope === "future" && plan.scheduleId) {
      await prisma.plannedWorkout.deleteMany({
        where: {
          userId: user.id,
          scheduleId: plan.scheduleId,
          date: { gte: plan.date },
          status: "PLANNED",
        },
      });
    } else {
      await prisma.plannedWorkout.delete({ where: { id: plan.id } });
    }

    refreshPlans();
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to delete that planned workout."),
    };
  }
}

export async function movePlanAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = movePlanSchema.parse(input);
    const plan = await ownedPlan(user.id, data.planId);
    await prisma.plannedWorkout.update({
      where: { id: plan.id },
      data: { date: fromInputDate(data.date) },
    });
    refreshPlans(plan.workout?.id ?? undefined);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to move that workout."),
    };
  }
}

export async function completePlanAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { planId } = planIdSchema.parse(input);
    const plan = await ownedPlan(user.id, planId);
    await prisma.plannedWorkout.update({
      where: { id: plan.id },
      data: { status: plan.status === "COMPLETED" ? "PLANNED" : "COMPLETED" },
    });
    refreshPlans(plan.workout?.id ?? undefined);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to update that plan."),
    };
  }
}

export async function startPlannedWorkoutAction(
  input: unknown
): Promise<ActionResult<{ workoutId: string }>> {
  try {
    const user = await requireUser();
    const { planId } = planIdSchema.parse(input);
    const plan = await ownedPlan(user.id, planId);

    if (!canStartPlannedWorkout(plan.kind)) {
      throw new ActionError("Rest and check-in days stay on the calendar.");
    }

    if (plan.workout?.id) {
      const existing = await prisma.workout.findFirst({
        where: { id: plan.workout.id, userId: user.id },
      });
      if (existing && existing.status === "IN_PROGRESS") {
        return { ok: true, data: { workoutId: existing.id } };
      }
      if (existing && existing.status === "COMPLETED") {
        throw new ActionError("This planned workout is already completed.");
      }
    }

    if (plan.date.getTime() > toDateOnly().getTime()) {
      throw new ActionError("Move this workout to today before starting it.");
    }

    const loggingPast = isPastDate(plan.date);
    const muscleGroups =
      plan.muscleGroups.length > 0
        ? plan.muscleGroups
        : plan.kind === "CARDIO"
          ? (["CARDIO"] as MuscleGroup[])
          : (["FULL_BODY"] as MuscleGroup[]);

    const workout = await prisma.$transaction(async (tx) => {
      return tx.workout.create({
        data: {
          userId: user.id,
          plannedWorkoutId: plan.id,
          title: plan.title || titleFromMuscleGroups(muscleGroups),
          notes: plan.notes,
          muscleGroups,
          date: plan.date,
          status: "IN_PROGRESS",
          startedAt: loggingPast ? plan.date : new Date(),
          exercises: {
            create: plan.exercises.map((item) => ({
              exerciseId: item.exerciseId,
              order: item.order,
              notes: item.notes,
              sets: {
                create: (item.sets.length
                  ? item.sets
                  : expandPlannedSets({ targetSets: 3 })
                ).map((set) => ({
                  order: set.order,
                  weight: "targetWeight" in set ? set.targetWeight : null,
                  reps: "targetReps" in set ? set.targetReps : null,
                  restSeconds: set.restSeconds,
                  completed: false,
                })),
              },
            })),
          },
        },
      });
    });

    refreshPlans(workout.id);
    return { ok: true, data: { workoutId: workout.id } };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to start that planned workout."),
    };
  }
}

export async function savePlanAsTemplateAction(
  input: unknown
): Promise<ActionResult<{ templateId: string }>> {
  try {
    const user = await requireUser();
    const data = saveTemplateSchema.parse(input);
    const plan = await ownedPlan(user.id, data.planId);
    const template = await prisma.workoutTemplate.create({
      data: {
        userId: user.id,
        title: data.title?.trim() || plan.title,
        kind: plan.kind,
        muscleGroups: plan.muscleGroups,
        notes: plan.notes,
        exercises: {
          create: plan.exercises.map((item) => ({
            exerciseId: item.exerciseId,
            order: item.order,
            notes: item.notes,
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
    refreshPlans();
    return { ok: true, data: { templateId: template.id } };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to save that template."),
    };
  }
}


export async function saveWorkoutAsTemplateAction(
  input: unknown
): Promise<ActionResult<{ templateId: string }>> {
  try {
    const user = await requireUser();
    const data = saveWorkoutTemplateSchema.parse(input);
    const workout = await prisma.workout.findFirst({
      where: { id: data.workoutId, userId: user.id },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: { sets: { orderBy: { order: "asc" } } },
        },
      },
    });
    if (!workout) throw new ActionError("We could not find that workout.");
    if (workout.exercises.length === 0) {
      throw new ActionError("Add exercises before saving this as a template.");
    }
    const kind = workout.muscleGroups.includes("CARDIO") && workout.muscleGroups.length === 1
      ? "CARDIO"
      : "STRENGTH";
    const template = await prisma.workoutTemplate.create({
      data: {
        userId: user.id,
        title: data.title?.trim() || workout.title,
        kind,
        muscleGroups: workout.muscleGroups,
        notes: workout.notes,
        exercises: {
          create: workout.exercises.map((item) => ({
            exerciseId: item.exerciseId,
            order: item.order,
            notes: item.notes,
            sets: {
              create:
                item.sets.length > 0
                  ? item.sets.map((set) => ({
                      order: set.order,
                      targetWeight: set.weight,
                      targetReps: set.reps,
                      restSeconds: set.restSeconds,
                    }))
                  : [{ order: 1, targetWeight: null, targetReps: 10, restSeconds: 90 }],
            },
          })),
        },
      },
    });
    refreshPlans(workout.id);
    return { ok: true, data: { templateId: template.id } };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to save that workout as a template."),
    };
  }
}

export async function applyTemplateAction(
  input: unknown
): Promise<ActionResult<{ planId: string }>> {
  try {
    const user = await requireUser();
    const data = applyTemplateSchema.parse(input);
    const template = await prisma.workoutTemplate.findFirst({
      where: { id: data.templateId, userId: user.id },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: { sets: { orderBy: { order: "asc" } } },
        },
      },
    });
    if (!template) throw new ActionError("That template is no longer available.");

    const created = await prisma.plannedWorkout.create({
      data: {
        userId: user.id,
        title: template.title,
        date: fromInputDate(data.date),
        kind: template.kind,
        muscleGroups: template.muscleGroups,
        notes: template.notes,
        templateId: template.id,
        exercises: {
          create: template.exercises.map((item) => ({
            exerciseId: item.exerciseId,
            order: item.order,
            notes: item.notes,
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
    refreshPlans();
    return { ok: true, data: { planId: created.id } };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to add that template to the calendar."),
    };
  }
}

export async function deleteTemplateAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { templateId } = templateIdSchema.parse(input);
    await prisma.workoutTemplate.deleteMany({
      where: { id: templateId, userId: user.id },
    });
    refreshPlans();
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to delete that template."),
    };
  }
}

export async function upsertRecurringAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const data = upsertRecurringSchema.parse(input);
    const intervalWeeks = intervalWeeksOf(data.interval, data.intervalWeeks);
    const payload = {
      title: data.title,
      weekday: data.weekday,
      interval: data.interval,
      intervalWeeks,
      kind: data.kind as PlanKind,
      muscleGroups: data.muscleGroups as MuscleGroup[],
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      templateId: data.templateId ?? null,
      isActive: data.isActive ?? true,
    };

    const row = data.id
      ? await prisma.workoutSchedule.update({
          where: { id: data.id },
          data: payload,
        })
      : await prisma.workoutSchedule.create({
          data: { userId: user.id, ...payload },
        });

    refreshPlans();
    return { ok: true, data: { id: row.id } };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to save that weekly schedule."),
    };
  }
}

export async function deleteRecurringAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = deleteRecurringSchema.parse(input);
    const row = await prisma.workoutSchedule.findFirst({
      where: { id: data.id, userId: user.id },
    });
    if (!row) throw new ActionError("That recurring schedule was not found.");

    if (data.deleteFuture) {
      await prisma.plannedWorkout.deleteMany({
        where: {
          userId: user.id,
          scheduleId: row.id,
          date: { gte: toDateOnly() },
          status: "PLANNED",
        },
      });
    }

    await prisma.workoutSchedule.update({
      where: { id: row.id },
      data: { isActive: false },
    });

    refreshPlans();
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to remove that recurring schedule."),
    };
  }
}

export async function applyProposedScheduleAction(input: unknown): Promise<ActionResult<{ count: number }>> {
  try {
    const user = await requireUser();
    const data = applyProposedScheduleSchema.parse(input);
    let count = 0;

    for (const day of data.days) {
      const exerciseIds: { exerciseId: string; targetSets?: number; targetReps?: number }[] = [];
      for (const exercise of day.exercises ?? []) {
        const found = await prisma.exercise.findFirst({
          where: {
            name: { equals: exercise.name, mode: "insensitive" },
            OR: [{ userId: null }, { userId: user.id }],
          },
        });
        if (found) {
          exerciseIds.push({
            exerciseId: found.id,
            targetSets: exercise.targetSets,
            targetReps: exercise.targetReps,
          });
        }
      }

      await prisma.plannedWorkout.create({
        data: {
          userId: user.id,
          title: day.title,
          date: fromInputDate(day.date),
          startTime: day.startTime || null,
          kind: day.kind,
          muscleGroups: day.muscleGroups as MuscleGroup[],
          notes: day.notes || "Proposed by MUSE Coach — review and adjust anytime.",
          exercises: {
            create: plannedExerciseCreates(
              exerciseIds.map((item) => ({
                exerciseId: item.exerciseId,
                targetSets: item.targetSets ?? 3,
                targetReps: item.targetReps ?? 10,
              }))
            ),
          },
        },
      });
      count += 1;
    }

    refreshPlans();
    return { ok: true, data: { count } };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to add that proposed schedule."),
    };
  }
}

export async function skipPlanAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { planId } = planIdSchema.parse(input);
    const plan = await ownedPlan(user.id, planId);
    await prisma.plannedWorkout.update({
      where: { id: plan.id },
      data: { status: "SKIPPED" },
    });
    refreshPlans();
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to skip that workout."),
    };
  }
}

export async function quickCreatePlanAction(
  input: unknown
): Promise<ActionResult<{ planId: string }>> {
  try {
    const user = await requireUser();
    const data = quickCreatePlanSchema.parse(input);
    const date = fromInputDate(data.date);
    const existing = await prisma.plannedWorkout.findFirst({
      where: { userId: user.id, date, kind: data.kind, status: { not: "SKIPPED" } },
    });
    if (existing) {
      const labels = { REST: "a rest day", CARDIO: "cardio", CHECK_IN: "a check-in" };
      throw new ActionError(`This day already has ${labels[data.kind]}.`);
    }
    const titles = { REST: "Rest Day", CARDIO: "Cardio", CHECK_IN: "Progress check-in" };
    const groups = { REST: [], CARDIO: ["CARDIO"] as MuscleGroup[], CHECK_IN: [] };
    const created = await prisma.plannedWorkout.create({
      data: {
        userId: user.id,
        title: data.title?.trim() || titles[data.kind],
        date,
        kind: data.kind,
        muscleGroups: groups[data.kind],
        cardioMinutes: data.kind === "CARDIO" ? data.cardioMinutes || 30 : null,
      },
    });
    refreshPlans();
    return { ok: true, data: { planId: created.id } };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to add that to the calendar."),
    };
  }
}

export async function completeSelectedDayAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = completeDaySchema.parse(input);
    const date = fromInputDate(data.date);
    const open = await prisma.plannedWorkout.findMany({
      where: { userId: user.id, date, status: "PLANNED" },
    });
    if (open.length === 0) {
      throw new ActionError("Nothing planned to complete on this day. Add a session first.");
    }
    await prisma.plannedWorkout.updateMany({
      where: { id: { in: open.map((plan) => plan.id) } },
      data: { status: "COMPLETED" },
    });
    refreshPlans();
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to mark that day complete."),
    };
  }
}

export { dateKey };
