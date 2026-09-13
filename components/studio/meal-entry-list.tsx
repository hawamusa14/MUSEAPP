"use client";

import { useState, useTransition } from "react";
import {
  deleteNutritionEntryAction,
  updateNutritionEntryAction,
  upsertSavedMealAction,
} from "@/lib/actions/nutrition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mealTypeLabel, type MealEntryDTO } from "@/lib/nutrition";
import { formatShortDate, fromInputDate } from "@/lib/dates";

export function MealEntryList({
  meals,
  showDate,
}: {
  meals: MealEntryDTO[];
  showDate?: boolean;
}) {
  if (meals.length === 0) {
    return <p className="text-sm text-muted-foreground">No meals logged yet.</p>;
  }

  return (
    <div className="space-y-3">
      {meals.map((meal) => (
        <MealEntryRow key={meal.id} meal={meal} showDate={showDate} />
      ))}
    </div>
  );
}

function MealEntryRow({ meal, showDate }: { meal: MealEntryDTO; showDate?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="rounded-2xl border border-border px-3 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium">{meal.foodName}</p>
            <p className="text-sm text-muted-foreground">
              {showDate ? `${formatShortDate(fromInputDate(meal.date))} · ` : ""}
              {mealTypeLabel(meal.mealType)} · {Math.round(meal.protein)}g protein · {Math.round(meal.calories)} cal
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await upsertSavedMealAction({
                    name: meal.foodName,
                    mealType: meal.mealType,
                    calories: meal.calories,
                    protein: meal.protein,
                    carbs: meal.carbs,
                    fat: meal.fat,
                  });
                  if (!result.ok) setError(result.error);
                })
              }
            >
              Save
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="min-h-11"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  if (!window.confirm("Remove this meal from the day?")) return;
                  const result = await deleteNutritionEntryAction({ entryId: meal.id });
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

  return (
    <form
      className="space-y-3 rounded-2xl border border-border px-3 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await updateNutritionEntryAction({
            entryId: meal.id,
            date: String(form.get("date") || meal.date),
            mealType: String(form.get("mealType") || meal.mealType),
            foodName: String(form.get("foodName") || ""),
            calories: Number(form.get("calories")),
            protein: Number(form.get("protein") || 0),
            carbs: Number(form.get("carbs") || 0),
            fat: Number(form.get("fat") || 0),
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setError(null);
          setEditing(false);
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`meal-name-${meal.id}`}>Food</Label>
          <Input id={`meal-name-${meal.id}`} name="foodName" defaultValue={meal.foodName} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`meal-type-${meal.id}`}>Meal</Label>
          <select
            id={`meal-type-${meal.id}`}
            name="mealType"
            defaultValue={meal.mealType}
            className="h-11 w-full rounded-xl border border-input bg-background px-3"
          >
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="DINNER">Dinner</option>
            <option value="SNACK">Snack</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="space-y-1">
          <Label htmlFor={`meal-date-${meal.id}`}>Date</Label>
          <Input id={`meal-date-${meal.id}`} name="date" type="date" defaultValue={meal.date} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`meal-cal-${meal.id}`}>Calories</Label>
          <Input id={`meal-cal-${meal.id}`} name="calories" type="number" min="0" defaultValue={meal.calories} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`meal-pro-${meal.id}`}>Protein</Label>
          <Input id={`meal-pro-${meal.id}`} name="protein" type="number" min="0" step="0.1" defaultValue={meal.protein} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`meal-carb-${meal.id}`}>Carbs</Label>
          <Input id={`meal-carb-${meal.id}`} name="carbs" type="number" min="0" step="0.1" defaultValue={meal.carbs} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`meal-fat-${meal.id}`}>Fat</Label>
          <Input id={`meal-fat-${meal.id}`} name="fat" type="number" min="0" step="0.1" defaultValue={meal.fat} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="min-h-11" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
        <Button type="button" variant="ghost" className="min-h-11" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
