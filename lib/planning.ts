import type { MuscleGroup, PlanKind, PlanStatus } from "@prisma/client";

export const PLAN_KINDS: { value: PlanKind; label: string; icon: string }[] = [
  { value: "STRENGTH", label: "Strength", icon: "🏋️" },
  { value: "CARDIO", label: "Cardio", icon: "🔥" },
  { value: "ACTIVE_RECOVERY", label: "Active Recovery", icon: "🚶" },
  { value: "MOBILITY", label: "Mobility", icon: "🧘" },
  { value: "REST", label: "Rest Day", icon: "☁️" },
  { value: "CHECK_IN", label: "Progress Check-in", icon: "📸" },
  { value: "CUSTOM", label: "Personal Event", icon: "✦" },
];

export const PLAN_CATEGORIES: {
  id: string;
  label: string;
  kind: PlanKind;
  muscleGroups: MuscleGroup[];
}[] = [
  { id: "UPPER_BODY", label: "Upper Body", kind: "STRENGTH", muscleGroups: ["UPPER_BODY"] },
  { id: "LOWER_BODY", label: "Lower Body", kind: "STRENGTH", muscleGroups: ["LOWER_BODY"] },
  { id: "CHEST", label: "Chest", kind: "STRENGTH", muscleGroups: ["CHEST"] },
  { id: "BACK", label: "Back", kind: "STRENGTH", muscleGroups: ["BACK"] },
  { id: "SHOULDERS", label: "Shoulders", kind: "STRENGTH", muscleGroups: ["SHOULDERS"] },
  { id: "ARMS", label: "Arms", kind: "STRENGTH", muscleGroups: ["ARMS"] },
  { id: "FOREARMS", label: "Forearms", kind: "STRENGTH", muscleGroups: ["FOREARMS"] },
  { id: "GLUTES", label: "Glutes", kind: "STRENGTH", muscleGroups: ["GLUTES"] },
  { id: "LEGS", label: "Legs", kind: "STRENGTH", muscleGroups: ["QUADS", "HAMSTRINGS", "CALVES"] },
  { id: "CORE", label: "Core", kind: "STRENGTH", muscleGroups: ["CORE"] },
  { id: "FULL_BODY", label: "Full Body", kind: "STRENGTH", muscleGroups: ["FULL_BODY"] },
  { id: "CARDIO", label: "Cardio", kind: "CARDIO", muscleGroups: ["CARDIO"] },
  { id: "ACTIVE_RECOVERY", label: "Active Recovery", kind: "ACTIVE_RECOVERY", muscleGroups: ["MOBILITY"] },
  { id: "MOBILITY", label: "Mobility", kind: "MOBILITY", muscleGroups: ["MOBILITY"] },
  { id: "REST", label: "Rest Day", kind: "REST", muscleGroups: [] },
];

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function planKindMeta(kind: PlanKind) {
  return PLAN_KINDS.find((item) => item.value === kind) ?? PLAN_KINDS[0];
}

export function isRecoveryKind(kind: PlanKind) {
  return kind === "REST" || kind === "ACTIVE_RECOVERY" || kind === "MOBILITY";
}

export function canStartPlannedWorkout(kind: PlanKind) {
  return kind !== "REST" && kind !== "CHECK_IN";
}

export function planStatusLabel(status: PlanStatus) {
  if (status === "COMPLETED") return "Completed";
  if (status === "SKIPPED") return "Skipped";
  return "Planned";
}

export function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start && !end) return null;
  if (start && end) return `${formatClock(start)} – ${formatClock(end)}`;
  return formatClock(start ?? end ?? "");
}

export function formatClock(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours)) return value;
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes || 0).padStart(2, "0")} ${suffix}`;
}

export function inferCategoryId(kind: PlanKind, groups: MuscleGroup[]) {
  const exact = PLAN_CATEGORIES.find(
    (item) =>
      item.kind === kind &&
      item.muscleGroups.length === groups.length &&
      item.muscleGroups.every((group) => groups.includes(group))
  );
  return exact?.id ?? PLAN_CATEGORIES.find((item) => item.kind === kind)?.id ?? "FULL_BODY";
}

export function flattenPlannedSets(
  sets: { targetReps: number | null; targetWeight: number | null; restSeconds: number | null }[]
) {
  return {
    targetSets: sets.length || null,
    targetReps: sets[0]?.targetReps ?? null,
    targetWeight: sets[0]?.targetWeight ?? null,
    restSeconds: sets[0]?.restSeconds ?? null,
  };
}

export function expandPlannedSets(input: {
  targetSets?: number | null;
  targetReps?: number | null;
  targetWeight?: number | null;
  restSeconds?: number | null;
}) {
  const count = Math.max(1, input.targetSets ?? 3);
  return Array.from({ length: count }, (_, index) => ({
    order: index + 1,
    targetReps: input.targetReps ?? null,
    targetWeight: input.targetWeight ?? null,
    restSeconds: input.restSeconds ?? null,
  }));
}

export type PlanExerciseDTO = {
  id: string;
  exerciseId: string;
  name: string;
  order: number;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  restSeconds: number | null;
  notes: string | null;
};

export type PlanDTO = {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  kind: PlanKind;
  muscleGroups: MuscleGroup[];
  notes: string | null;
  stepGoal: number | null;
  cardioMinutes: number | null;
  status: PlanStatus;
  workoutId: string | null;
  workoutStatus: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | null;
  templateId: string | null;
  recurrenceId: string | null;
  exercises: PlanExerciseDTO[];
};

export type DayMarkDTO = {
  date: string;
  plans: PlanDTO[];
  workoutTitles: string[];
  hasCompletedWorkout: boolean;
  hasPlanned: boolean;
  hasRest: boolean;
  hasCardio: boolean;
  hasNutrition: boolean;
  hasPhoto: boolean;
  steps: number | null;
  activeCalories: number | null;
  calories: number | null;
  protein: number | null;
};

export type DayDetailDTO = {
  date: string;
  plans: PlanDTO[];
  workouts: {
    id: string;
    title: string;
    status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    exerciseCount: number;
  }[];
  steps: number | null;
  stepGoal: number;
  activeCalories: number | null;
  cardio: { type: string; durationMin: number }[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
  meals: {
    id: string;
    date: string;
    mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
  calorieTarget: number | null;
  proteinTarget: number | null;
  carbsTarget: number | null;
  fatTarget: number | null;
  caloriesBurned: number;
  notes: string[];
  photoCount: number;
};

export type TemplateDTO = {
  id: string;
  title: string;
  kind: PlanKind;
  muscleGroups: MuscleGroup[];
  notes: string | null;
  exercises: PlanExerciseDTO[];
};

export type RecurringDTO = {
  id: string;
  title: string;
  weekday: number;
  interval: "WEEKLY" | "BIWEEKLY" | "CUSTOM";
  intervalWeeks: number;
  kind: PlanKind;
  muscleGroups: MuscleGroup[];
  startTime: string | null;
  endTime: string | null;
  isActive: boolean;
};

export type GoalPulseDTO = {
  workoutsDone: number;
  workoutsTarget: number | null;
  steps: number;
  stepGoal: number;
  protein: number;
  proteinTarget: number | null;
};

export type ProposedDay = {
  date: string;
  title: string;
  kind: PlanKind;
  muscleGroups: MuscleGroup[];
  startTime?: string | null;
  notes?: string | null;
  exercises?: { name: string; targetSets?: number; targetReps?: number }[];
};

export type CalendarHubDTO = {
  view: "month" | "week";
  month: string;
  week: string;
  selectedDay: string;
  monthLabel: string;
  weekLabel: string;
  monthCells: Array<string | null>;
  weekDays: string[];
  marks: Record<string, DayMarkDTO>;
  day: DayDetailDTO;
  templates: TemplateDTO[];
  recurrences: RecurringDTO[];
  goals: GoalPulseDTO;
  today: string;
};
