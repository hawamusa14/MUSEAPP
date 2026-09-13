"use client";

import { useState, useTransition } from "react";
import {
  deleteSavedMealAction,
  logSavedMealAction,
  upsertSavedMealAction,
} from "@/lib/actions/nutrition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mealTypeLabel, type SavedMealDTO } from "@/lib/nutrition";

export function SavedMeals({ meals, today }: { meals: SavedMealDTO[]; today: string }) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Keep snacks and meals you eat often. Log one onto a day, or change the macros later.
        </p>
        <Button type="button" variant="outline" className="min-h-11" onClick={() => setCreating(true)}>
          New saved meal
        </Button>
      </div>
      {creating ? <SavedMealForm today={today} onClose={() => setCreating(false)} /> : null}
      {meals.length === 0 && !creating ? (
        <p className="text-sm text-muted-foreground">No saved meals or snacks yet.</p>
      ) : (
        meals.map((meal) => <SavedMealRow key={meal.id} meal={meal} today={today} />)
      )}
    </div>
  );
}

function SavedMealRow({ meal, today }: { meal: SavedMealDTO; today: string }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return <SavedMealForm meal={meal} today={today} onClose={() => setEditing(false)} />;
  }

  return (
    <div className="rounded-2xl border border-border px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{meal.name}</p>
          <p className="text-sm text-muted-foreground">
            {mealTypeLabel(meal.mealType)} · {Math.round(meal.protein)}g protein · {Math.round(meal.calories)} cal
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="min-h-11"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await logSavedMealAction({ savedMealId: meal.id, date: today });
                if (!result.ok) setError(result.error);
              })
            }
          >
            {pending ? "Adding..." : "Log today"}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="min-h-11"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (!window.confirm("Remove this saved meal?")) return;
                const result = await deleteSavedMealAction({ savedMealId: meal.id });
                if (!result.ok) setError(result.error);
              })
            }
          >
            Delete
          </Button>
        </div>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function SavedMealForm({
  meal,
  today,
  onClose,
}: {
  meal?: SavedMealDTO;
  today: string;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3 rounded-2xl border border-primary/25 bg-accent/30 px-3 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await upsertSavedMealAction({
            id: meal?.id,
            name: String(form.get("name") || ""),
            mealType: String(form.get("mealType") || "SNACK"),
            calories: Number(form.get("calories")),
            protein: Number(form.get("protein") || 0),
            carbs: Number(form.get("carbs") || 0),
            fat: Number(form.get("fat") || 0),
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          onClose();
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`saved-name-${meal?.id || "new"}`}>Name</Label>
          <Input
            id={`saved-name-${meal?.id || "new"}`}
            name="name"
            defaultValue={meal?.name || ""}
            placeholder="Greek yogurt, afternoon snack..."
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`saved-type-${meal?.id || "new"}`}>Usually</Label>
          <select
            id={`saved-type-${meal?.id || "new"}`}
            name="mealType"
            defaultValue={meal?.mealType || "SNACK"}
            className="h-11 w-full rounded-xl border border-input bg-background px-3"
          >
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="DINNER">Dinner</option>
            <option value="SNACK">Snack</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor={`saved-cal-${meal?.id || "new"}`}>Calories</Label>
          <Input id={`saved-cal-${meal?.id || "new"}`} name="calories" type="number" min="0" defaultValue={meal?.calories ?? 0} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`saved-pro-${meal?.id || "new"}`}>Protein</Label>
          <Input id={`saved-pro-${meal?.id || "new"}`} name="protein" type="number" min="0" step="0.1" defaultValue={meal?.protein ?? 0} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`saved-carb-${meal?.id || "new"}`}>Carbs</Label>
          <Input id={`saved-carb-${meal?.id || "new"}`} name="carbs" type="number" min="0" step="0.1" defaultValue={meal?.carbs ?? 0} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`saved-fat-${meal?.id || "new"}`}>Fat</Label>
          <Input id={`saved-fat-${meal?.id || "new"}`} name="fat" type="number" min="0" step="0.1" defaultValue={meal?.fat ?? 0} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="min-h-11" disabled={pending}>
          {pending ? "Saving..." : meal ? "Save changes" : "Save meal"}
        </Button>
        <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>
          Cancel
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <p className="sr-only">{today}</p>
    </form>
  );
}
