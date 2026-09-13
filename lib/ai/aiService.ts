import { requireUser } from "@/lib/auth";
import { buildAiContext } from "@/lib/ai/aiContext";
import { mockCoachReply, type CoachReply } from "@/lib/ai/scheduleCoach";

export async function askMuseCoach(question: string): Promise<
  CoachReply & { provider: "muse" }
> {
  const user = await requireUser();
  const context = await buildAiContext(user.id);
  return { ...mockCoachReply(question, context), provider: "muse" };
}
