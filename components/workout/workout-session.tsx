"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ExerciseCategory } from "@prisma/client";
import {
  finishWorkoutAction,
  renameWorkoutAction,
} from "@/lib/actions/workouts";
import { addSetAction } from "@/lib/actions/sets";
import {
  removeWorkoutExerciseAction,
  renameWorkoutExerciseAction,
} from "@/lib/actions/exercises";
import { formatShortDate } from "@/lib/dates";
import { titleCaseName } from "@/lib/names";
import { muscleGroupLabel } from "@/lib/muscle-groups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { RestTimer } from "@/components/workout/rest-timer";
import { isWarmupSet, SetRow } from "@/components/workout/set-row";
import { TitleEditor } from "@/components/ui/title-editor";
import { WorkoutTimer } from "@/components/workout/workout-timer";
import type { LastPerformance, WorkoutDetail } from "@/types";
import { SaveTemplateButton } from "@/components/calendar/save-template-button";
import { DeleteWorkoutButton } from "@/components/workout/delete-workout-button";

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
  const workoutDate = new Date(workout.date);
  const isPastLog =
    workoutDate.getTime() <
    new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())).getTime();

  return (
    <div className="muse-page mx-auto max-w-3xl space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">
            {isOpen ? (isPastLog ? "Past log" : "Live session") : "Completed"}
          </p>
          <TitleEditor
            heading
            value={workout.title}
            onSave={async (title) => {
              const result = await renameWorkoutAction({ workoutId: workout.id, title });
              if (result.ok) router.refresh();
              return result;
            }}
          />
          <p className="mt-2 text-sm text-muted-foreground">{formatShortDate(workoutDate)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {workout.muscleGroups.map((group) => (
              <Badge key={group}>{muscleGroupLabel(group)}</Badge>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-start gap-3">
            {workout.exercises.length > 0 ? (
              <SaveTemplateButton workoutId={workout.id} title={workout.title} />
            ) : null}
            <DeleteWorkoutButton workoutId={workout.id} redirectTo="/workout" />
          </div>
        </div>
        {isOpen && !isPastLog ? (
          <div className="sticky top-0 z-20 -mx-1 rounded-2xl border border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
            <WorkoutTimer
              workoutId={workout.id}
              startedAt={workout.startedAt}
              pausedAt={workout.pausedAt}
              pausedMs={workout.pausedMs}
            />
          </div>
        ) : null}
      </header>

      {prMessage ? (
        <Card className="pr-celebrate border-primary/40 bg-accent">
          <p className="font-medium">{prMessage}</p>
        </Card>
      ) : null}

      {workout.exercises.map((item) => {
        const last = lastPerformance[item.exerciseId];
        return (
          <Card key={item.id}>
            <CardHeader className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <TitleEditor
                  value={titleCaseName(item.exercise.name)}
                  className="font-heading text-xl tracking-tight"
                  onSave={async (name) => {
                    const result = await renameWorkoutExerciseAction({
                      workoutExerciseId: item.id,
                      name,
                    });
                    if (result.ok) router.refresh();
                    return result;
                  }}
                />
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
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    if (!window.confirm("Remove this exercise from the workout?")) return;
                    const result = await removeWorkoutExerciseAction({
                      workoutId: workout.id,
                      workoutExerciseId: item.id,
                    });
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    router.refresh();
                  })
                }
              >
                Remove
              </Button>
            </CardHeader>
            <div className="space-y-3">
              {item.sets.map((set, index) => {
                const warmup = isWarmupSet(set.notes);
                const workingNumber = item.sets
                  .slice(0, index)
                  .filter((entry) => !isWarmupSet(entry.notes)).length;
                return (
                  <SetRow
                    key={set.id}
                    set={set}
                    unit={unit}
                    label={warmup ? "Warm-up" : `Set ${workingNumber + 1}`}
                    canMoveUp={isOpen && index > 0}
                    canMoveDown={isOpen && index < item.sets.length - 1}
                  />
                );
              })}
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
                  const params = new URLSearchParams({ done: "1" });
                  if (result.data.personalRecords) {
                    params.set("pr", String(result.data.personalRecords));
                  }
                  router.push(`/dashboard?${params.toString()}`);
                })
              }
            >
              {isPastLog ? "Save Workout" : "Finish Workout"}
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
