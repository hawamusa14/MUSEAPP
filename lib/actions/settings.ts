"use server";

import { revalidatePath } from "next/cache";
import type { ActivityLevel, FitnessExperience, FitnessGoalKind } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toActionError, type ActionResult } from "@/lib/errors";
import { updateSettingsSchema } from "@/lib/validations/settings";

export async function updateSettingsAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = updateSettingsSchema.parse(input);

    await prisma.$transaction([
      prisma.userSettings.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          weightUnit: data.weightUnit,
          heightUnit: data.heightUnit,
          theme: data.theme,
        },
        update: {
          weightUnit: data.weightUnit,
          heightUnit: data.heightUnit,
          theme: data.theme,
        },
      }),
      prisma.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          heightCm: data.heightCm ?? null,
          activityLevel: (data.activityLevel ?? null) as ActivityLevel | null,
          experience: (data.experience ?? null) as FitnessExperience | null,
          primaryGoalKind: (data.primaryGoalKind ?? null) as FitnessGoalKind | null,
          targetWeight: data.targetWeight ?? null,
          trainingFrequency: data.trainingFrequency ?? null,
          preferredDurationMin: data.preferredDurationMin ?? null,
        },
        update: {
          heightCm: data.heightCm ?? null,
          activityLevel: (data.activityLevel ?? null) as ActivityLevel | null,
          experience: (data.experience ?? null) as FitnessExperience | null,
          primaryGoalKind: (data.primaryGoalKind ?? null) as FitnessGoalKind | null,
          targetWeight: data.targetWeight ?? null,
          trainingFrequency: data.trainingFrequency ?? null,
          preferredDurationMin: data.preferredDurationMin ?? null,
        },
      }),
    ]);

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/workout");
    revalidatePath("/nutrition");
    revalidatePath("/goals");
    revalidatePath("/ai-coach");
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to save your settings."),
    };
  }
}
