import { requireUser } from "@/lib/auth";
import { buildAiContext } from "@/lib/ai/aiContext";

export async function askMuseCoach(question: string) {
  const user = await requireUser();
  const context = await buildAiContext(user.id);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      provider: "mock" as const,
      text: mockCoachReply(question, context.name),
    };
  }

  return {
    provider: "openai" as const,
    text: "The AI provider is configured, but live coaching will be connected in a later phase.",
  };
}

function mockCoachReply(question: string, name?: string) {
  return [
    `${name ? `${name}, ` : ""}based on the information in your MUSE journal, here is a general starting point.`,
    `"${question}" is a good question. I can review your workouts, recovery, and consistency once this coach is fully connected.`,
    "Consider training a muscle group you have not hit in a few days, eating enough protein for your goal, and treating any date estimates as approximate — never medical advice.",
  ].join(" ");
}
