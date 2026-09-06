import type { MuscleGroup } from "@prisma/client";

export const MUSCLE_GROUP_OPTIONS: { value: MuscleGroup; label: string }[] = [
  { value: "CHEST", label: "Chest" },
  { value: "BACK", label: "Back" },
  { value: "SHOULDERS", label: "Shoulders" },
  { value: "ARMS", label: "Arms" },
  { value: "BICEPS", label: "Biceps" },
  { value: "TRICEPS", label: "Triceps" },
  { value: "FOREARMS", label: "Forearms" },
  { value: "GLUTES", label: "Glutes" },
  { value: "QUADS", label: "Quads" },
  { value: "HAMSTRINGS", label: "Hamstrings" },
  { value: "CALVES", label: "Calves" },
  { value: "CORE", label: "Core" },
  { value: "UPPER_BODY", label: "Upper Body" },
  { value: "LOWER_BODY", label: "Lower Body" },
  { value: "FULL_BODY", label: "Full Body" },
  { value: "CARDIO", label: "Cardio" },
  { value: "MOBILITY", label: "Mobility" },
];

export function muscleGroupLabel(group: MuscleGroup) {
  return MUSCLE_GROUP_OPTIONS.find((option) => option.value === group)?.label ?? group;
}

export function titleFromMuscleGroups(groups: MuscleGroup[]) {
  if (groups.length === 0) return "Workout";
  return groups.map(muscleGroupLabel).join(" + ");
}
