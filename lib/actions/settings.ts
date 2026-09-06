"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toActionError, type ActionResult } from "@/lib/errors";
import { updateSettingsSchema } from "@/lib/validations/settings";

export async function updateSettingsAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = updateSettingsSchema.parse(input);

    await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...data,
      },
      update: data,
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/workout");
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "Unable to save your settings."),
    };
  }
}
