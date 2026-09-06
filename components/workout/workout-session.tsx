"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ExerciseCategory } from "@prisma/client";
import {
  cancelWorkoutAction,
  finishWorkoutAction,
} from "@/lib/actions/workouts";
import { addSetAction } from "@/lib/actions/sets";
import { removeWorkoutExerciseAction } from "@/lib/actions/exercises";
import { muscleGroupLabel } from "@/lib/muscle-groups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { RestTimer } from "@/components/workout/rest-timer";
import { SetRow } from "@/components/workout/set-row";
import { WorkoutTimer } from "@/components/workout/workout-timer";
import type { LastPerformance, WorkoutDetail } from "@/types";

export function WorkoutSession({
  workout,
  lastPerformance,
  weightUnit,
  categories,
}: {
  workout: WorkoutDetail;
  lastPerformance: Record<string, LastPerformance | null>;
  weightUnit: "LB" | "KG";
  categories: ExerciseCategory[];
}) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [prMessage, setPrMessage] = useState<string | null>(null);
  const unit = weightUnit === "KG" ? "kg" : "lb";
  const isOpen = workout.status === "IN_PROGRESS";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">
            {isOpen ? "Live session" : "Completed"}
          </p>
          <h1 className="mt-1 font-heading text-4xl">{workout.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {workout.muscleGroups.map((group) => (
              <Badge key={group}>{muscleGroupLabel(group)}</Badge>
            ))}
          </div>
        </div>
        {isOpen ? (
          <WorkoutTimer
            workoutId={workout.id}
            startedAt={workout.startedAt}
            pausedAt={workout.pausedAt}
            pausedMs={workout.pausedMs}
          />
        ) : null}
      </header>

      {prMessage ? (
        <Card className="border-primary/40 bg-accent">
          <p className="font-medium">{prMessage}</p>
        </Card>
      ) : null}

      {workout.exercises.map((item) => {
        const last = lastPerformance[item.exerciseId];
        return (
          <Card key={item.id}>
            <CardHeader className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{item.exercise.name}</CardTitle>
                <CardDescription>
                  {item.exercise.category.name}
                  {item.exercise.equipment ? ` · ${item.exercise.equipment}` : ""}
                </CardDescription>
                {last ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Last time: {last.summary}
                    {last.hint ? ` · ${last.hint}` : ""}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    First time logging this movement.
                  </p>
                )}
              </div>
              {isOpen ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      await removeWorkoutExerciseAction({
                        workoutId: workout.id,
                        workoutExerciseId: item.id,
                      });
                    })
                  }
                >
                  Remove
                </Button>
              ) : null}
            </CardHeader>
            <div className="space-y-3">
              {item.sets.map((set, index) => (
                <SetRow
                  key={set.id}
                  set={set}
                  unit={unit}
                  canMoveUp={isOpen && index > 0}
                  canMoveDown={isOpen && index < item.sets.length - 1}
                />
              ))}
            </div>
            {isOpen ? (
              <Button
                className="mt-4 min-h-12 w-full"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await addSetAction({
                      workoutExerciseId: item.id,
                    });
                    if (!result.ok) setError(result.error);
                  })
                }
              >
                Add Set
              </Button>
            ) : null}
          </Card>
        );
      })}

      {isOpen ? (
        <>
          <Button
            className="min-h-12 w-full"
            onClick={() => setPickerOpen(true)}
          >
            Add exercise
          </Button>
          <RestTimer />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="min-h-12 flex-1"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await finishWorkoutAction({ workoutId: workout.id });
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  if (result.data.personalRecords > 0) {
                    setPrMessage(
                      `${result.data.personalRecords} new personal record${
                        result.data.personalRecords === 1 ? "" : "s"
                      } saved.`
                    );
                  }
                  router.push(
                    `/dashboard${
                      result.data.personalRecords
                        ? `?pr=${result.data.personalRecords}`
                        : ""
                    }`
                  );
                })
              }
            >
              Finish workout
            </Button>
            <Button
              className="min-h-12"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await cancelWorkoutAction({ workoutId: workout.id });
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  router.push("/workout");
                })
              }
            >
              Discard
            </Button>
          </div>
        </>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {pickerOpen ? (
        <ExercisePicker
          workoutId={workout.id}
          categories={categories}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </div>
  );
}
