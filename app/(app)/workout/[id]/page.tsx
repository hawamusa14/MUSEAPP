import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getExerciseCategories } from "@/lib/data/exercises";
import { getLastPerformanceMap, getWorkoutForUser } from "@/lib/data/workouts";
import { WorkoutSession } from "@/components/workout/workout-session";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const workout = await getWorkoutForUser(user.id, id);

  if (!workout) {
    notFound();
  }

  const [lastPerformance, categories] = await Promise.all([
    getLastPerformanceMap(
      user.id,
      workout.exercises.map((item) => item.exerciseId),
      workout.id,
      user.settings?.weightUnit ?? "LB"
    ),
    getExerciseCategories(),
  ]);

  return (
    <WorkoutSession
      workout={workout}
      lastPerformance={lastPerformance}
      weightUnit={user.settings?.weightUnit ?? "LB"}
      categories={categories}
    />
  );
}
