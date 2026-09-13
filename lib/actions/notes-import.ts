"use server";

import type { MuscleGroup } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fromInputDate } from "@/lib/dates";
import { ActionError, toActionError, type ActionResult } from "@/lib/errors";
import { revalidateStudio } from "@/lib/revalidate";
import { importNotesSchema } from "@/lib/validations/notes-import";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function scoreNames(query: string, candidate: string) {
  return query === candidate ? 100 : 0;
}

export async function importWorkoutNotesAction(
  input: unknown
): Promise<ActionResult<{ imported: number; skipped: number }>> {
  try {
    const user = await requireUser();
    const data = importNotesSchema.parse(input);
    const catalog = await prisma.exercise.findMany({
      where: { OR: [{ userId: null }, { userId: user.id }] },
      select: { id: true, name: true },
    });
    const category =
      (await prisma.exerciseCategory.findFirst({
        where: {
          OR: [
            { muscleGroup: "ARMS" },
            { slug: { contains: "arm", mode: "insensitive" } },
            { name: { contains: "arm", mode: "insensitive" } },
          ],
        },
      })) || (await prisma.exerciseCategory.findFirst());
    if (!category) {
      throw new ActionError("Add exercise categories before importing notes.");
    }

    let imported = 0;
    let skipped = 0;

    for (const workout of data.workouts) {
      const date = fromInputDate(workout.date);
      const existing = await prisma.workout.findFirst({
        where: { userId: user.id, date, title: workout.title, status: "COMPLETED" },
      });
      if (existing) {
        skipped += 1;
        continue;
      }

      const exerciseIds: string[] = [];
      for (const item of workout.exercises) {
        const query = normalize(item.name);
        let best: { id: string; score: number } | null = null;
        for (const row of catalog) {
          const next = scoreNames(query, normalize(row.name));
          if (!best || next > best.score) best = { id: row.id, score: next };
        }
        if (best && best.score >= 100) {
          exerciseIds.push(best.id);
          continue;
        }
        const created = await prisma.exercise.create({
          data: {
            name: item.name,
            slug: `${slugify(item.name)}-${user.id.slice(-6)}-${catalog.length + exerciseIds.length}`,
            categoryId: category.id,
            userId: user.id,
            isCustom: true,
          },
        });
        catalog.push({ id: created.id, name: created.name });
        exerciseIds.push(created.id);
      }

      const setCount = workout.exercises.reduce((sum, item) => sum + item.sets.length, 0);
      const durationSeconds = Math.max(15 * 60, setCount * 90);
      const startedAt = new Date(date.getTime() + 12 * 60 * 60 * 1000);
      const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000);

      await prisma.workout.create({
        data: {
          userId: user.id,
          title: workout.title,
          date,
          status: "COMPLETED",
          muscleGroups: workout.muscleGroups as MuscleGroup[],
          notes: "Imported from notes",
          startedAt,
          endedAt,
          durationSeconds,
          exercises: {
            create: workout.exercises.map((item, order) => ({
              exerciseId: exerciseIds[order],
              order,
              notes: item.notes || null,
              sets: {
                create: item.sets.map((set, setOrder) => ({
                  order: setOrder + 1,
                  weight: set.weight,
                  reps: set.reps,
                  notes: set.notes || null,
                  completed: true,
                })),
              },
            })),
          },
        },
      });
      imported += 1;
    }

    revalidateStudio(
      "/workout",
      "/history",
      "/calendar",
      "/analytics",
      "/progress",
      "/dashboard",
      "/goals"
    );
    return { ok: true, data: { imported, skipped } };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to import those notes."),
    };
  }
}
