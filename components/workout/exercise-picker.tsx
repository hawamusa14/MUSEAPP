"use client";

import { useEffect, useState, useTransition } from "react";
import type { Exercise, ExerciseCategory } from "@prisma/client";
import {
  addExerciseToWorkoutAction,
  createCustomExerciseAction,
  searchExercisesAction,
} from "@/lib/actions/exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SearchResult = Exercise & { category: ExerciseCategory };

export function ExercisePicker({
  workoutId,
  categories,
  onClose,
}: {
  workoutId: string;
  categories: ExerciseCategory[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const handle = window.setTimeout(() => {
      startTransition(async () => {
        const items = await searchExercisesAction({
          query,
          categoryId: categoryId || undefined,
        });
        setResults(items);
      });
    }, 180);
    return () => window.clearTimeout(handle);
  }, [query, categoryId]);

  function add(exerciseId: string) {
    startTransition(async () => {
      const result = await addExerciseToWorkoutAction({ workoutId, exerciseId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  function createCustom() {
    startTransition(async () => {
      const result = await createCustomExerciseAction({
        workoutId,
        name: customName,
        categoryId: categoryId || categories[0]?.id,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-foreground/20 p-0 sm:place-items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-picker-title"
    >
      <div className="flex h-[92vh] w-full max-w-xl flex-col rounded-t-3xl bg-background p-5 shadow-2xl sm:h-auto sm:max-h-[85vh] sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="exercise-picker-title" className="font-heading text-2xl">
            Add exercise
          </h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="exercise-search">Search</Label>
            <Input
              id="exercise-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Bench, hip thrust, plank..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exercise-category">Category</Label>
            <select
              id="exercise-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <ul className="mt-4 flex-1 space-y-2 overflow-y-auto">
          {results.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                onClick={() => add(exercise.id)}
                disabled={pending}
                className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-border px-4 text-left hover:bg-accent"
              >
                <span>
                  <span className="block font-medium">{exercise.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {exercise.category.name}
                    {exercise.isCustom ? " · Custom" : ""}
                    {exercise.equipment ? ` · ${exercise.equipment}` : ""}
                  </span>
                </span>
                <span className="text-sm text-primary">Add</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-border pt-4">
          <Label htmlFor="custom-exercise">Create custom exercise</Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="custom-exercise"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="My movement"
            />
            <Button type="button" onClick={createCustom} disabled={pending || !customName.trim()}>
              Save
            </Button>
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
