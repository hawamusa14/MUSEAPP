"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fromInputDate } from "@/lib/dates";
import { toActionError, type ActionResult } from "@/lib/errors";
import { revalidateStudio } from "@/lib/revalidate";
import { journalSchema } from "@/lib/validations/studio";

export async function addJournalAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = journalSchema.parse(input);
    const date = fromInputDate(data.date);
    const workout = await prisma.workout.findFirst({
      where: {
        userId: user.id,
        date,
        status: { in: ["COMPLETED", "IN_PROGRESS"] },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    await prisma.journalEntry.create({
      data: {
        userId: user.id,
        date,
        entry: data.entry,
        energy: data.energy,
        sleep: data.sleep,
        recovery: data.recovery,
        stress: data.stress,
        workoutNotes: data.workoutNotes,
        workoutId: workout?.id,
      },
    });
    revalidateStudio("/journal", "/calendar", "/dashboard");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toActionError(error, "Unable to save that journal.") };
  }
}
