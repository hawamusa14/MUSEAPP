"use server";

import { PersonalRecordType, type MuscleGroup } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fromInputDate, isPastDate, toDateOnly } from "@/lib/dates";
import { titleFromMuscleGroups } from "@/lib/muscle-groups";
import { ActionError, toActionError, type ActionResult } from "@/lib/errors";
import { estimatedOneRepMax, setVolume } from "@/lib/calculations/strength";
import { getWorkoutForUser } from "@/lib/data/workouts";
import { revalidateStudio } from "@/lib/revalidate";
import { workoutElapsedSeconds } from "@/lib/workout-metrics";
import { startWorkoutSchema, workoutIdSchema } from "@/lib/validations/workout";

function refreshWorkout(workoutId: string) {
  revalidateStudio("/dashboard", "/workout", `/workout/${workoutId}`, "/calendar", "/history", "/analytics");
}

async function ownedWorkout(userId: string, workoutId: string) {
  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, userId },
  });

  if (!workout) {
    throw new ActionError("We could not find that workout.");
  }

  return workout;
}

export async function startWorkoutAction(
  input: unknown
): Promise<ActionResult<{ workoutId: string; resumed?: boolean }>> {
  try {
    const user = await requireUser();
    const data = startWorkoutSchema.parse(input);
    const date = data.date ? fromInputDate(data.date) : toDateOnly();

    if (date.getTime() > toDateOnly().getTime()) {
      throw new ActionError("Choose today or a past date.");
    }

    const loggingPast = isPastDate(date);

    if (!loggingPast) {
      const existing = await prisma.workout.findFirst({
        where: { userId: user.id, status: "IN_PROGRESS", date: toDateOnly() },
      });

      if (existing) {
        return { ok: true, data: { workoutId: existing.id, resumed: true } };
      }
    }

    const muscleGroups = data.muscleGroups as MuscleGroup[];
    const workout = await prisma.workout.create({
      data: {
        userId: user.id,
        title: data.title?.trim() || titleFromMuscleGroups(muscleGroups),
        notes: data.notes,
        muscleGroups,
        date,
        status: "IN_PROGRESS",
        startedAt: loggingPast ? date : new Date(),
      },
    });

    refreshWorkout(workout.id);
    return { ok: true, data: { workoutId: workout.id } };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Something went wrong while starting your workout."),
    };
  }
}

export async function pauseWorkoutAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { workoutId } = workoutIdSchema.parse(input);
    const workout = await ownedWorkout(user.id, workoutId);

    if (workout.status !== "IN_PROGRESS" || workout.pausedAt) {
      return { ok: true, data: undefined };
    }

    await prisma.workout.update({
      where: { id: workout.id },
      data: { pausedAt: new Date() },
    });

    refreshWorkout(workout.id);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to pause the workout timer."),
    };
  }
}

export async function resumeWorkoutAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { workoutId } = workoutIdSchema.parse(input);
    const workout = await ownedWorkout(user.id, workoutId);

    if (!workout.pausedAt) {
      return { ok: true, data: undefined };
    }

    const extra = Date.now() - workout.pausedAt.getTime();
    await prisma.workout.update({
      where: { id: workout.id },
      data: {
        pausedAt: null,
        pausedMs: workout.pausedMs + extra,
      },
    });

    refreshWorkout(workout.id);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to resume the workout timer."),
    };
  }
}

export async function finishWorkoutAction(
  input: unknown
): Promise<ActionResult<{ personalRecords: number }>> {
  try {
    const user = await requireUser();
    const { workoutId } = workoutIdSchema.parse(input);
    await ownedWorkout(user.id, workoutId);

    const detailed = await getWorkoutForUser(user.id, workoutId);
    if (!detailed) {
      throw new ActionError("We could not find that workout.");
    }

    const endedAt = new Date();
    const durationSeconds = workoutElapsedSeconds({
      ...detailed,
      endedAt,
    });

    const createdRecords = await prisma.$transaction(async (tx) => {
      await tx.workout.update({
        where: { id: workoutId },
        data: {
          status: "COMPLETED",
          endedAt,
          pausedAt: null,
          durationSeconds,
        },
      });

      let count = 0;

      for (const workoutExercise of detailed.exercises) {
        const completedSets = workoutExercise.sets.filter(
          (set) => set.completed && (set.weight || set.reps)
        );
        if (completedSets.length === 0) continue;

        const heaviest = Math.max(
          0,
          ...completedSets.map((set) => set.weight ?? 0)
        );
        const mostReps = Math.max(0, ...completedSets.map((set) => set.reps ?? 0));
        const volume = completedSets.reduce(
          (sum, set) => sum + setVolume(set.weight, set.reps),
          0
        );
        const best1rm = Math.max(
          0,
          ...completedSets.map((set) =>
            set.weight && set.reps
              ? estimatedOneRepMax(set.weight, set.reps)
              : 0
          )
        );

        const candidates: {
          type: PersonalRecordType;
          value: number;
          weight?: number;
          reps?: number;
        }[] = [
          { type: "HEAVIEST_WEIGHT", value: heaviest, weight: heaviest },
          { type: "MOST_REPS", value: mostReps, reps: mostReps },
          { type: "HIGHEST_VOLUME", value: volume },
          { type: "ESTIMATED_1RM", value: best1rm },
        ];

        for (const candidate of candidates) {
          if (candidate.value <= 0) continue;

          const previous = await tx.personalRecord.findFirst({
            where: {
              userId: user.id,
              exerciseId: workoutExercise.exerciseId,
              type: candidate.type,
            },
            orderBy: { value: "desc" },
          });

          if (previous && candidate.value <= previous.value) continue;

          await tx.personalRecord.create({
            data: {
              userId: user.id,
              exerciseId: workoutExercise.exerciseId,
              type: candidate.type,
              value: candidate.value,
              weight: candidate.weight,
              reps: candidate.reps,
              workoutId,
            },
          });
          count += 1;
        }
      }

      return count;
    }, { timeout: 20000, maxWait: 10000 });

    refreshWorkout(workoutId);
    return { ok: true, data: { personalRecords: createdRecords } };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Something went wrong while saving your workout."),
    };
  }
}

export async function cancelWorkoutAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { workoutId } = workoutIdSchema.parse(input);
    await ownedWorkout(user.id, workoutId);

    await prisma.workout.update({
      where: { id: workoutId },
      data: {
        status: "CANCELLED",
        endedAt: new Date(),
      },
    });

    refreshWorkout(workoutId);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to discard this workout."),
    };
  }
}
