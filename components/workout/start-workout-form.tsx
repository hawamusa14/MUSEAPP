"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MuscleGroup } from "@prisma/client";
import { startWorkoutAction } from "@/lib/actions/workouts";
import { MUSCLE_GROUP_OPTIONS } from "@/lib/muscle-groups";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StartWorkoutForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<MuscleGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggle(group: MuscleGroup) {
    setSelected((current) =>
      current.includes(group)
        ? current.filter((item) => item !== group)
        : [...current, group]
    );
  }

  function start() {
    startTransition(async () => {
      const result = await startWorkoutAction({ muscleGroups: selected });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/workout/${result.data.workoutId}`);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start workout</CardTitle>
        <CardDescription>
          Choose the muscle groups you want to train. You can add any exercise next.
        </CardDescription>
      </CardHeader>
      <div className="flex flex-wrap gap-2">
        {MUSCLE_GROUP_OPTIONS.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-accent"
              )}
              aria-pressed={active}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <Button
        className="mt-6 min-h-12 w-full sm:w-auto"
        onClick={start}
        disabled={pending || selected.length === 0}
      >
        {pending ? "Opening session..." : "Start Workout"}
      </Button>
    </Card>
  );
}
