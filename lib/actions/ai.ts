"use server";

import { askMuseCoach } from "@/lib/ai/aiService";
import { toActionError, type ActionResult } from "@/lib/errors";
import { coachQuestionSchema } from "@/lib/validations/plan";
import type { ProposedDay } from "@/lib/planning";

export async function askCoachAction(
  input: unknown
): Promise<ActionResult<{ text: string; proposal?: ProposedDay[]; provider: "muse" }>> {
  try {
    const { question } = coachQuestionSchema.parse(input);
    const reply = await askMuseCoach(question);
    return { ok: true, data: reply };
  } catch (error) {
    return {
      ok: false,
      error: toActionError(error, "The coach could not answer just now."),
    };
  }
}
