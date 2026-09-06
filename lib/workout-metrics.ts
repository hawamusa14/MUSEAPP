import type { MuscleGroup } from "@prisma/client";
import { estimatedOneRepMax, setVolume } from "@/lib/calculations/strength";

function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function workoutElapsedSeconds(workout: {
  startedAt: Date | string;
  pausedAt: Date | string | null;
  pausedMs: number;
  endedAt?: Date | string | null;
  durationSeconds?: number | null;
}) {
  if (workout.durationSeconds != null && workout.endedAt) {
    return workout.durationSeconds;
  }

  const startedAt = asDate(workout.startedAt) ?? new Date();
  const pausedAt = asDate(workout.pausedAt);
  const end = asDate(workout.endedAt) ?? new Date();
  const pausedNow = pausedAt ? end.getTime() - pausedAt.getTime() : 0;

  return Math.max(
    0,
    Math.floor(
      (end.getTime() - startedAt.getTime() - workout.pausedMs - pausedNow) / 1000
    )
  );
}

export function summarizeWorkout(workout: {
  muscleGroups: MuscleGroup[];
  exercises: {
    exercise: { name: string };
    sets: { weight: number | null; reps: number | null; completed: boolean }[];
  }[];
}) {
  const completedSets = workout.exercises.flatMap((item) =>
    item.sets.filter((set) => set.completed)
  );

  return {
    exerciseCount: workout.exercises.length,
    setCount: workout.exercises.reduce((sum, item) => sum + item.sets.length, 0),
    completedSetCount: completedSets.length,
    volume: completedSets.reduce(
      (sum, set) => sum + setVolume(set.weight, set.reps),
      0
    ),
    estimated1rm: Math.max(
      0,
      ...completedSets.map((set) =>
        set.weight && set.reps ? estimatedOneRepMax(set.weight, set.reps) : 0
      )
    ),
  };
}
