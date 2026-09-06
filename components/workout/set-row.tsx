"use client";

import { useState, useTransition } from "react";
import {
  deleteSetAction,
  duplicateSetAction,
  reorderSetAction,
  updateSetAction,
} from "@/lib/actions/sets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SetValue = {
  id: string;
  order: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  restSeconds: number | null;
  notes: string | null;
  completed: boolean;
};

export function SetRow({
  set,
  unit,
  canMoveUp,
  canMoveDown,
}: {
  set: SetValue;
  unit: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [weight, setWeight] = useState(set.weight?.toString() ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);

  function save(partial: Record<string, unknown>) {
    startTransition(async () => {
      const result = await updateSetAction({ setId: set.id, ...partial });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div
      className={cn(
        "rounded-2xl border p-3 transition-colors",
        set.completed ? "border-primary/40 bg-accent/60" : "border-border bg-background"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Set {set.order}</p>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-5 accent-[var(--primary)]"
            checked={set.completed}
            onChange={(event) => save({ completed: event.target.checked })}
            aria-label={`Mark set ${set.order} complete`}
          />
          Done
        </label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`weight-${set.id}`}>Weight ({unit})</Label>
          <Input
            id={`weight-${set.id}`}
            inputMode="decimal"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            onBlur={() =>
              save({ weight: weight === "" ? null : Number(weight) })
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`reps-${set.id}`}>Reps</Label>
          <Input
            id={`reps-${set.id}`}
            inputMode="numeric"
            value={reps}
            onChange={(event) => setReps(event.target.value)}
            onBlur={() => save({ reps: reps === "" ? null : Number(reps) })}
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await duplicateSetAction({ setId: set.id });
              if (!result.ok) setError(result.error);
            })
          }
        >
          Duplicate Set
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending || !canMoveUp}
          onClick={() =>
            startTransition(async () => {
              await reorderSetAction({ setId: set.id, direction: "up" });
            })
          }
        >
          Up
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending || !canMoveDown}
          onClick={() =>
            startTransition(async () => {
              await reorderSetAction({ setId: set.id, direction: "down" });
            })
          }
        >
          Down
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteSetAction({ setId: set.id });
              if (!result.ok) setError(result.error);
            })
          }
        >
          Delete
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
