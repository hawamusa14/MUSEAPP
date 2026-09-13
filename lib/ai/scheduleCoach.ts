import type { MuscleGroup, PlanKind } from "@prisma/client";
import { dateKey, formatShortDate, fromInputDate, startOfWeek, toDateOnly, weekDays } from "@/lib/dates";
import { muscleGroupLabel } from "@/lib/muscle-groups";
import type { PlanDTO, ProposedDay } from "@/lib/planning";

export type CoachContext = {
  name?: string | null;
  goals: string[];
  recentWorkouts: { title: string; date: Date; muscleGroups: MuscleGroup[] }[];
  upcoming: PlanDTO[];
  today: string;
  frequencyTarget: number | null;
  activityLevel?: string | null;
  trainingFrequency?: number | null;
  todaySteps?: number | null;
  todayProtein?: number | null;
  todayCalories?: number | null;
};

export type CoachReply = {
  text: string;
  proposal?: ProposedDay[];
};

function weekdayName(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(date);
}

function lastTrained(context: CoachContext, group: MuscleGroup) {
  return context.recentWorkouts.find((workout) => workout.muscleGroups.includes(group));
}

function planOn(context: CoachContext, date: string) {
  return context.upcoming.filter((plan) => plan.date === date);
}

function defaultWeekTemplate(): { title: string; kind: PlanKind; muscleGroups: MuscleGroup[] }[] {
  return [
    { title: "Lower Body + Glutes", kind: "STRENGTH", muscleGroups: ["LOWER_BODY", "GLUTES"] },
    { title: "Upper Body", kind: "STRENGTH", muscleGroups: ["UPPER_BODY"] },
    { title: "Cardio + Core", kind: "CARDIO", muscleGroups: ["CARDIO", "CORE"] },
    { title: "Back + Shoulders", kind: "STRENGTH", muscleGroups: ["BACK", "SHOULDERS"] },
    { title: "Rest Day", kind: "REST", muscleGroups: [] },
    { title: "Active Recovery", kind: "ACTIVE_RECOVERY", muscleGroups: ["MOBILITY"] },
    { title: "Lower Body", kind: "STRENGTH", muscleGroups: ["LOWER_BODY"] },
  ];
}

export function buildWeekProposal(from = toDateOnly()): ProposedDay[] {
  const start = startOfWeek(from);
  const template = defaultWeekTemplate();
  return weekDays(start).map((date, index) => ({
    date: dateKey(date),
    title: template[index].title,
    kind: template[index].kind,
    muscleGroups: template[index].muscleGroups,
    notes: "Suggested from your current training pattern. Approve only if it feels right.",
  }));
}

export function mockCoachReply(question: string, context: CoachContext): CoachReply {
  const q = question.toLowerCase();
  const name = context.name ? `${context.name.split(" ")[0]}, ` : "";
  const tomorrow = new Date(toDateOnly());
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowKey = dateKey(tomorrow);
  const todayPlans = planOn(context, context.today);
  const tomorrowPlans = planOn(context, tomorrowKey);

  if (q.includes("tomorrow") && (q.includes("doing") || q.includes("plan") || q.includes("schedule"))) {
    if (tomorrowPlans.length === 0) {
      return {
        text: `${name}nothing is scheduled for ${weekdayName(tomorrow)} yet. A lower-body or recovery day would keep your recent pattern balanced. I can draft a week if you want one.`,
      };
    }
    return {
      text: `${name}tomorrow is ${weekdayName(tomorrow)}. You have ${tomorrowPlans
        .map((plan) => `${plan.title}${plan.startTime ? ` at ${plan.startTime}` : ""}`)
        .join(", ")}. If you only have a short window, keep the first two movements and finish with a brief walk.`,
    };
  }

  if (q.includes("today") && (q.includes("doing") || q.includes("train") || q.includes("workout"))) {
    if (todayPlans.length === 0) {
      return {
        text: `${name}today is open. Looking at your recent sessions, a focused strength day or a recovery walk would both fit. I will not tell you that you must train.`,
      };
    }
    return {
      text: `${name}today on your calendar: ${todayPlans.map((plan) => plan.title).join(", ")}. Start the planned session from Calendar when you are ready — it will open the tracker with those exercises.`,
    };
  }

  if (q.includes("glute")) {
    const last = lastTrained(context, "GLUTES") ?? lastTrained(context, "LOWER_BODY");
    const when = last ? formatShortDate(last.date) : "not recently";
    return {
      text: `${name}your last glute-focused session looks like ${when}. A common spacing is two to three days between hard lower-body days. Check tomorrow and the next rest day on your calendar before adding another.`,
    };
  }

  if (q.includes("rest")) {
    const tomorrowRest = tomorrowPlans.some((plan) => plan.kind === "REST");
    return {
      text: `${name}${
        tomorrowRest
          ? "tomorrow is already a rest day on your calendar."
          : "if the last two days were demanding, a rest or mobility day is a reasonable option."
      } I cannot diagnose soreness or injury — if something feels wrong, ease off and use your own judgment.`,
    };
  }

  if (q.includes("missed") || q.includes("skip") || q.includes("move it")) {
    const missed = todayPlans.find((plan) => plan.status === "PLANNED");
    const nextOpen = context.upcoming.find(
      (plan) => plan.date > context.today && (plan.kind === "REST" || plan.status === "PLANNED")
    );
    return {
      text: `${name}${
        missed
          ? `you can drag “${missed.title}” onto the next open day in the week view.`
          : "if today’s session did not happen, move it to the next lighter day rather than stacking two hard sessions."
      } ${nextOpen ? `A natural landing spot is ${formatShortDate(fromInputDate(nextOpen.date))}.` : ""}`.trim(),
    };
  }

  if (
    q.includes("schedule") ||
    q.includes("plan my") ||
    q.includes("build me") ||
    q.includes("next week")
  ) {
    return {
      text: `${name}here is a suggested week based on a lower / upper / cardio / recovery rhythm${
        context.frequencyTarget ? ` and a ${context.frequencyTarget}× training target` : ""
      }. Nothing is saved until you approve it. Adjust any day before it becomes part of your calendar.`,
      proposal: buildWeekProposal(),
    };
  }

  if (q.includes("45") || q.includes("short") || q.includes("adjust")) {
    const target = tomorrowPlans[0] ?? todayPlans[0];
    return {
      text: `${name}${
        target
          ? `for “${target.title}”, keep 3 compound movements, 3 sets each, and finish with 8–10 minutes of easy cardio if you only have 45 minutes.`
          : "for a 45-minute window, choose 3 compound lifts and leave isolation work for another day."
      } This is general programming, not medical advice.`,
    };
  }

  const recent = context.recentWorkouts
    .slice(0, 3)
    .map((workout) => `${workout.title} (${workout.muscleGroups.map(muscleGroupLabel).join(", ")})`)
    .join("; ");

  return {
    text: `${name}I can see your upcoming calendar, recent sessions${recent ? ` such as ${recent}` : ""}, and goals${
      context.goals.length ? ` (${context.goals.join(", ")})` : ""
    }. Ask what you are doing tomorrow, whether to rest, or to draft a week — I will use your actual schedule. I will not diagnose injuries or make medical claims.`,
  };
}
