"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionError, toActionError, type ActionResult } from "@/lib/errors";
import { searchExercises } from "@/lib/data/exercises";
import {
  addExerciseSchema,
  createCustomExerciseSchema,
  removeWorkoutExerciseSchema,
  renameWorkoutExerciseSchema,
  searchExercisesSchema,
} from "@/lib/validations/workout";
import { revalidateStudio } from "@/lib/revalidate";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

export async function searchExercisesAction(input: unknown) {
  const user = await requireUser();
  const data = searchExercisesSchema.parse(input);
  return searchExercises({
    userId: user.id,
    query: data.query,
    categoryId: data.categoryId,
  });
}

export async function addExerciseToWorkoutAction(
  input: unknown
): Promise<ActionResult<{ workoutExerciseId: string }>> {
  try {
    const user = await requireUser();
    const data = addExerciseSchema.parse(input);
    await ownedWorkout(user.id, data.workoutId);

    const exercise = await prisma.exercise.findFirst({
      where: {
        id: data.exerciseId,
        OR: [{ userId: null }, { userId: user.id }],
      },
    });

    if (!exercise) {
      throw new ActionError("That exercise is not available.");
    }

    const existing = await prisma.workoutExercise.findFirst({
      where: {
        workoutId: data.workoutId,
        exerciseId: exercise.id,
      },
    });

    if (existing) {
      return { ok: true, data: { workoutExerciseId: existing.id } };
    }

    const last = await prisma.workoutExercise.findFirst({
      where: { workoutId: data.workoutId },
      orderBy: { order: "desc" },
    });

    const created = await prisma.workoutExercise.create({
      data: {
        workoutId: data.workoutId,
        exerciseId: exercise.id,
        order: (last?.order ?? 0) + 1,
        sets: {
          create: {
            order: 1,
            completed: false,
          },
        },
      },
    });

    revalidatePath(`/workout/${data.workoutId}`);
    revalidatePath("/workout");
    return { ok: true, data: { workoutExerciseId: created.id } };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to add that exercise."),
    };
  }
}

export async function createCustomExerciseAction(
  input: unknown
): Promise<ActionResult<{ exerciseId: string; workoutExerciseId: string }>> {
  try {
    const user = await requireUser();
    const data = createCustomExerciseSchema.parse(input);
    await ownedWorkout(user.id, data.workoutId);

    const category = await prisma.exerciseCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new ActionError("Choose a valid category.");
    }

    const slug = `${slugify(data.name)}-${user.id.slice(-6)}`;
    const exercise = await prisma.exercise.create({
      data: {
        name: data.name,
        slug,
        equipment: data.equipment,
        categoryId: category.id,
        userId: user.id,
        isCustom: true,
      },
    });

    const added = await addExerciseToWorkoutAction({
      workoutId: data.workoutId,
      exerciseId: exercise.id,
    });

    if (!added.ok) return added;

    return {
      ok: true,
      data: {
        exerciseId: exercise.id,
        workoutExerciseId: added.data.workoutExerciseId,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to create that custom exercise."),
    };
  }
}

export async function removeWorkoutExerciseAction(
  input: unknown
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = removeWorkoutExerciseSchema.parse(input);

    const workoutExercise = await prisma.workoutExercise.findFirst({
      where: {
        id: data.workoutExerciseId,
        workout: { id: data.workoutId, userId: user.id },
      },
    });

    if (!workoutExercise) {
      throw new ActionError("That exercise is not in this workout.");
    }

    await prisma.workoutExercise.delete({
      where: { id: workoutExercise.id },
    });

    revalidatePath(`/workout/${data.workoutId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to remove that exercise."),
    };
  }
}

export async function renameWorkoutExerciseAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = renameWorkoutExerciseSchema.parse(input);
    const row = await prisma.workoutExercise.findFirst({
      where: {
        id: data.workoutExerciseId,
        workout: { userId: user.id },
      },
      include: { exercise: true, workout: true },
    });
    if (!row) throw new ActionError("That exercise is not in this workout.");

    const current = row.exercise;
    const ownedCustom = Boolean(current.userId === user.id && current.isCustom);
    if (ownedCustom) {
      await prisma.exercise.update({
        where: { id: current.id },
        data: {
          name: data.name,
          slug: `${slugify(data.name)}-${user.id.slice(-6)}-${current.id.slice(-4)}`,
        },
      });
    } else {
      const match = await prisma.exercise.findFirst({
        where: {
          userId: user.id,
          name: { equals: data.name, mode: "insensitive" },
        },
      });
      const next =
        match ||
        (await prisma.exercise.create({
          data: {
            name: data.name,
            slug: `${slugify(data.name)}-${user.id.slice(-6)}-${row.id.slice(-4)}`,
            categoryId: current.categoryId,
            equipment: current.equipment,
            userId: user.id,
            isCustom: true,
          },
        }));
      await prisma.workoutExercise.update({
        where: { id: row.id },
        data: { exerciseId: next.id },
      });
    }

    revalidateStudio(
      "/workout",
      `/workout/${row.workoutId}`,
      "/history",
      "/calendar",
      "/analytics",
      "/dashboard"
    );
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to rename that exercise."),
    };
  }
}

