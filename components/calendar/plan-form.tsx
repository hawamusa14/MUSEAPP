"use client";

import { useEffect, useState, useTransition } from "react";
import type { Exercise, ExerciseCategory, MuscleGroup, PlanKind } from "@prisma/client";
import { searchExercisesAction } from "@/lib/actions/exercises";
import { upsertPlanAction } from "@/lib/actions/plans";
import { PLAN_CATEGORIES, inferCategoryId, type PlanDTO, type TemplateDTO } from "@/lib/planning";
import { MUSCLE_GROUP_OPTIONS } from "@/lib/muscle-groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { titleCaseName } from "@/lib/names";

type DraftExercise = {
  exerciseId: string;
  name: string;
  targetSets: string;
  targetReps: string;
  targetWeight: string;
  restSeconds: string;
};

export function PlanForm({
  date,
  plan,
  templates = [],
  presetCategoryId = "FULL_BODY",
  onClose,
}: {
  date: string;
  plan?: PlanDTO | null;
  templates?: TemplateDTO[];
  presetCategoryId?: string;
  onClose: () => void;
}) {
  const startingCategory = plan
    ? inferCategoryId(plan.kind, plan.muscleGroups)
    : presetCategoryId;
  const startingGroups =
    plan?.muscleGroups ??
    PLAN_CATEGORIES.find((item) => item.id === startingCategory)?.muscleGroups ??
    ["FULL_BODY"];
  const startingTitle =
    plan?.title ?? PLAN_CATEGORIES.find((item) => item.id === startingCategory)?.label ?? "";
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(startingTitle);
  const [day, setDay] = useState(plan?.date ?? date);
  const [startTime, setStartTime] = useState(plan?.startTime ?? "");
  const [endTime, setEndTime] = useState(plan?.endTime ?? "");
  const [categoryId, setCategoryId] = useState(startingCategory);
  const [groups, setGroups] = useState<MuscleGroup[]>(startingGroups);
  const [notes, setNotes] = useState(plan?.notes ?? "");
  const [stepGoal, setStepGoal] = useState(plan?.stepGoal?.toString() ?? "");
  const [cardioMinutes, setCardioMinutes] = useState(plan?.cardioMinutes?.toString() ?? "");
  const [recurrence, setRecurrence] = useState<"none" | "WEEKLY" | "BIWEEKLY" | "CUSTOM">("none");
  const [intervalWeeks, setIntervalWeeks] = useState("3");
  const [applyTo, setApplyTo] = useState<"one" | "future">("one");
  const [exercises, setExercises] = useState<DraftExercise[]>(
    plan?.exercises.map((item) => ({
      exerciseId: item.exerciseId,
      name: item.name,
      targetSets: item.targetSets?.toString() ?? "3",
      targetReps: item.targetReps?.toString() ?? "10",
      targetWeight: item.targetWeight?.toString() ?? "",
      restSeconds: item.restSeconds?.toString() ?? "90",
    })) ?? []
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(Exercise & { category: ExerciseCategory })[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      startTransition(async () => {
        const items = await searchExercisesAction({ query });
        setResults(items);
      });
    }, 180);
    return () => window.clearTimeout(handle);
  }, [query]);

  function applySavedTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    const nextCategory = inferCategoryId(template.kind, template.muscleGroups);
    setTitle(template.title);
    setCategoryId(nextCategory);
    setGroups(template.muscleGroups);
    setNotes(template.notes || "");
    setExercises(
      template.exercises.map((item) => ({
        exerciseId: item.exerciseId,
        name: item.name,
        targetSets: item.targetSets ? String(item.targetSets) : "3",
        targetReps: item.targetReps ? String(item.targetReps) : "10",
        targetWeight: item.targetWeight != null ? String(item.targetWeight) : "",
        restSeconds: item.restSeconds != null ? String(item.restSeconds) : "90",
      }))
    );
  }

  function chooseCategory(id: string) {
    const category = PLAN_CATEGORIES.find((item) => item.id === id);
    if (!category) return;
    setCategoryId(id);
    setGroups(category.muscleGroups);
    if (!title || PLAN_CATEGORIES.some((item) => item.label === title)) {
      setTitle(category.label);
    }
  }

  function addExercise(exercise: Exercise) {
    if (exercises.some((item) => item.exerciseId === exercise.id)) return;
    setExercises((current) => [
      ...current,
      {
        exerciseId: exercise.id,
        name: titleCaseName(exercise.name),
        targetSets: "3",
        targetReps: "10",
        targetWeight: "",
        restSeconds: "90",
      },
    ]);
    setQuery("");
  }

  function save() {
    const category = PLAN_CATEGORIES.find((item) => item.id === categoryId);
    startTransition(async () => {
      const result = await upsertPlanAction({
        id: plan?.id,
        title: title.trim() || category?.label || "Workout",
        date: day,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        kind: (category?.kind ?? "STRENGTH") as PlanKind,
        muscleGroups: groups,
        notes: notes.trim() || null,
        stepGoal: stepGoal ? Number(stepGoal) : null,
        cardioMinutes: cardioMinutes ? Number(cardioMinutes) : null,
        exercises: exercises.map((item) => ({
          exerciseId: item.exerciseId,
          targetSets: item.targetSets ? Number(item.targetSets) : null,
          targetReps: item.targetReps ? Number(item.targetReps) : null,
          targetWeight: item.targetWeight ? Number(item.targetWeight) : null,
          restSeconds: item.restSeconds ? Number(item.restSeconds) : null,
        })),
        recurrence:
          !plan && recurrence !== "none"
            ? {
                interval: recurrence,
                intervalWeeks: recurrence === "CUSTOM" ? Number(intervalWeeks) : undefined,
              }
            : undefined,
        applyTo: plan?.recurrenceId ? applyTo : undefined,
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
      className="fixed inset-0 z-50 grid place-items-end bg-foreground/25 p-0 sm:place-items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-form-title"
    >
      <div className="muse-modal flex h-[96dvh] w-full max-w-2xl flex-col rounded-t-3xl bg-background p-5 shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="plan-form-title" className="font-heading text-3xl">
            {plan ? "Edit plan" : "Plan a workout"}
          </h2>
          <Button variant="ghost" className="min-h-11" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="space-y-5 overflow-y-auto pr-1">
          {!plan && templates.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="plan-template">Paste a saved template</Label>
              <select
                id="plan-template"
                defaultValue=""
                onChange={(event) => {
                  if (event.target.value) applySavedTemplate(event.target.value);
                }}
                className="h-11 w-full rounded-xl border border-input bg-background px-3"
              >
                <option value="">Start blank, or choose a saved workout</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                    {template.exercises.length ? ` · ${template.exercises.length} exercises` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plan-title">Workout name</Label>
              <Input
                id="plan-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Lower Body + Glutes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-date">Date</Label>
              <Input id="plan-date" type="date" value={day} onChange={(event) => setDay(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-start">Start time</Label>
              <Input id="plan-start" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-end">End time</Label>
              <Input id="plan-end" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Category</p>
            <div className="flex flex-wrap gap-2">
              {PLAN_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => chooseCategory(category.id)}
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-sm transition-colors",
                    categoryId === category.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  )}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Muscle groups</p>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUP_OPTIONS.map((option) => {
                const active = groups.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setGroups((current) =>
                        active
                          ? current.filter((item) => item !== option.value)
                          : [...current, option.value]
                      )
                    }
                    className={cn(
                      "min-h-10 rounded-full border px-3 text-sm",
                      active ? "border-primary/50 bg-accent" : "border-border hover:bg-muted"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plan-cardio">Cardio minutes</Label>
              <Input
                id="plan-cardio"
                inputMode="numeric"
                value={cardioMinutes}
                onChange={(event) => setCardioMinutes(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-steps">Step goal</Label>
              <Input
                id="plan-steps"
                inputMode="numeric"
                value={stepGoal}
                onChange={(event) => setStepGoal(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-search">Add exercises</Label>
            <Input
              id="plan-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Hip thrust, Romanian deadlift..."
            />
            {query ? (
              <ul className="max-h-40 overflow-y-auto rounded-2xl border border-border">
                {results.map((exercise) => (
                  <li key={exercise.id}>
                    <button
                      type="button"
                      className="flex min-h-12 w-full items-center justify-between px-3 text-left hover:bg-accent"
                      onClick={() => addExercise(exercise)}
                    >
                      <span>{titleCaseName(exercise.name)}</span>
                      <span className="text-sm text-primary">Add</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="space-y-3">
            {exercises.map((item, index) => (
              <div key={item.exerciseId} className="rounded-2xl border border-border p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium">{titleCaseName(item.name)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExercises((current) => current.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Input
                    inputMode="numeric"
                    value={item.targetSets}
                    onChange={(event) =>
                      setExercises((current) =>
                        current.map((row, i) =>
                          i === index ? { ...row, targetSets: event.target.value } : row
                        )
                      )
                    }
                    placeholder="Sets"
                    aria-label="Target sets"
                  />
                  <Input
                    inputMode="numeric"
                    value={item.targetReps}
                    onChange={(event) =>
                      setExercises((current) =>
                        current.map((row, i) =>
                          i === index ? { ...row, targetReps: event.target.value } : row
                        )
                      )
                    }
                    placeholder="Reps"
                    aria-label="Target reps"
                  />
                  <Input
                    inputMode="decimal"
                    value={item.targetWeight}
                    onChange={(event) =>
                      setExercises((current) =>
                        current.map((row, i) =>
                          i === index ? { ...row, targetWeight: event.target.value } : row
                        )
                      )
                    }
                    placeholder="Weight"
                    aria-label="Target weight"
                  />
                  <Input
                    inputMode="numeric"
                    value={item.restSeconds}
                    onChange={(event) =>
                      setExercises((current) =>
                        current.map((row, i) =>
                          i === index ? { ...row, restSeconds: event.target.value } : row
                        )
                      )
                    }
                    placeholder="Rest sec"
                    aria-label="Rest seconds"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-notes">Notes</Label>
            <textarea
              id="plan-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-24 w-full rounded-2xl border border-input bg-background px-3 py-2"
              placeholder="Felt strong. Increase hip thrust next time."
            />
          </div>

          {!plan ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan-repeat">Repeat</Label>
                <select
                  id="plan-repeat"
                  value={recurrence}
                  onChange={(event) => setRecurrence(event.target.value as typeof recurrence)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3"
                >
                  <option value="none">Does not repeat</option>
                  <option value="WEEKLY">Every week</option>
                  <option value="BIWEEKLY">Every 2 weeks</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
              {recurrence === "CUSTOM" ? (
                <div className="space-y-2">
                  <Label htmlFor="plan-interval">Every N weeks</Label>
                  <Input
                    id="plan-interval"
                    inputMode="numeric"
                    value={intervalWeeks}
                    onChange={(event) => setIntervalWeeks(event.target.value)}
                  />
                </div>
              ) : null}
            </div>
          ) : plan.recurrenceId ? (
            <div className="space-y-2">
              <Label htmlFor="plan-apply">Apply changes</Label>
              <select
                id="plan-apply"
                value={applyTo}
                onChange={(event) => setApplyTo(event.target.value as typeof applyTo)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3"
              >
                <option value="one">This workout only</option>
                <option value="future">This and future workouts</option>
              </select>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <Button className="mt-4 min-h-12 w-full" disabled={pending} onClick={save}>
          {pending ? "Saving..." : plan ? "Save changes" : "Add to calendar"}
        </Button>
      </div>
    </div>
  );
}
