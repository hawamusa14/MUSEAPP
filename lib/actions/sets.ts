"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionError, toActionError, type ActionResult } from "@/lib/errors";
import {
  addSetSchema,
  reorderSetSchema,
  setIdSchema,
  updateSetSchema,
} from "@/lib/validations/workout";

async function ownedSet(userId: string, setId: string) {
  const set = await prisma.workoutSet.findFirst({
    where: {
      id: setId,
      workoutExercise: {
        workout: { userId },
      },
    },
    include: {
      workoutExercise: {
        include: { workout: true, sets: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!set) {
    throw new ActionError("We could not find that set.");
  }

  return set;
}

function refresh(workoutId: string) {
  revalidatePath(`/workout/${workoutId}`);
  revalidatePath("/workout");
  revalidatePath("/dashboard");
}

export async function addSetAction(
  input: unknown
): Promise<ActionResult<{ setId: string }>> {
  try {
    const user = await requireUser();
    const data = addSetSchema.parse(input);

    const workoutExercise = await prisma.workoutExercise.findFirst({
      where: {
        id: data.workoutExerciseId,
        workout: { userId: user.id },
      },
      include: { sets: { orderBy: { order: "desc" } } },
    });

    if (!workoutExercise) {
      throw new ActionError("That exercise is not in your workout.");
    }

    const last = workoutExercise.sets[0];
    const created = await prisma.workoutSet.create({
      data: {
        workoutExerciseId: workoutExercise.id,
        order: (last?.order ?? 0) + 1,
        weight: last?.weight ?? null,
        reps: last?.reps ?? null,
        rpe: last?.rpe ?? null,
        restSeconds: last?.restSeconds ?? null,
        completed: false,
      },
    });

    refresh(workoutExercise.workoutId);
    return { ok: true, data: { setId: created.id } };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to add a set."),
    };
  }
}

export async function duplicateSetAction(
  input: unknown
): Promise<ActionResult<{ setId: string }>> {
  try {
    const user = await requireUser();
    const { setId } = setIdSchema.parse(input);
    const source = await ownedSet(user.id, setId);

    await prisma.$transaction(async (tx) => {
      await tx.workoutSet.updateMany({
        where: {
          workoutExerciseId: source.workoutExerciseId,
          order: { gt: source.order },
        },
        data: { order: { increment: 1 } },
      });
    });

    const created = await prisma.workoutSet.create({
      data: {
        workoutExerciseId: source.workoutExerciseId,
        order: source.order + 1,
        weight: source.weight,
        reps: source.reps,
        rpe: source.rpe,
        restSeconds: source.restSeconds,
        notes: source.notes,
        completed: false,
      },
    });

    refresh(source.workoutExercise.workoutId);
    return { ok: true, data: { setId: created.id } };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to duplicate that set."),
    };
  }
}

export async function updateSetAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = updateSetSchema.parse(input);
    const set = await ownedSet(user.id, data.setId);

    await prisma.workoutSet.update({
      where: { id: set.id },
      data: {
        weight: data.weight === undefined ? set.weight : data.weight,
        reps: data.reps === undefined ? set.reps : data.reps,
        rpe: data.rpe === undefined ? set.rpe : data.rpe,
        restSeconds:
          data.restSeconds === undefined ? set.restSeconds : data.restSeconds,
        notes: data.notes === undefined ? set.notes : data.notes,
        completed: data.completed ?? set.completed,
      },
    });

    refresh(set.workoutExercise.workoutId);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to update that set."),
    };
  }
}

export async function deleteSetAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { setId } = setIdSchema.parse(input);
    const set = await ownedSet(user.id, setId);

    if (set.workoutExercise.sets.length <= 1) {
      throw new ActionError("Keep at least one set, or remove the exercise.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.workoutSet.delete({ where: { id: set.id } });
      await tx.workoutSet.updateMany({
        where: {
          workoutExerciseId: set.workoutExerciseId,
          order: { gt: set.order },
        },
        data: { order: { decrement: 1 } },
      });
    });

    refresh(set.workoutExercise.workoutId);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to delete that set."),
    };
  }
}

export async function reorderSetAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = reorderSetSchema.parse(input);
    const set = await ownedSet(user.id, data.setId);
    const sets = set.workoutExercise.sets;
    const index = sets.findIndex((item) => item.id === set.id);
    const swapWith = data.direction === "up" ? sets[index - 1] : sets[index + 1];

    if (!swapWith) {
      return { ok: true, data: undefined };
    }

    await prisma.$transaction([
      prisma.workoutSet.update({
        where: { id: set.id },
        data: { order: swapWith.order },
      }),
      prisma.workoutSet.update({
        where: { id: swapWith.id },
        data: { order: set.order },
      }),
    ]);

    refresh(set.workoutExercise.workoutId);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to reorder that set."),
    };
  }
}
