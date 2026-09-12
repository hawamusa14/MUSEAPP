"use client";

import { useState, useTransition } from "react";
import { addNutritionEntryAction, saveWaterAction } from "@/lib/actions/nutrition";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NutritionForm({ today, waterMl }: { today: string; waterMl: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function saveMeal(formData: FormData) {
    startTransition(async () => {
      const result = await addNutritionEntryAction({
        date: formData.get("date"),
        mealType: formData.get("mealType"),
        foodName: formData.get("foodName"),
        calories: formData.get("calories"),
        protein: formData.get("protein") || 0,
        carbs: formData.get("carbs") || 0,
        fat: formData.get("fat") || 0,
      });
      if (!result.ok) {
        setError(result.error);
        setMessage(null);
        return;
      }
      setError(null);
      setMessage("Meal saved.");
    });
  }

  function saveWater(formData: FormData) {
    startTransition(async () => {
      const result = await saveWaterAction({
        date: formData.get("waterDate"),
        waterMl: formData.get("waterMl"),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setMessage("Water updated.");
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <form action={saveMeal} className="space-y-4">
          <CardHeader>
            <CardTitle>Log food</CardTitle>
            <CardDescription>Meals update your daily calories and macros.</CardDescription>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={today} max={today} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mealType">Meal</Label>
              <select
                id="mealType"
                name="mealType"
                defaultValue="LUNCH"
                className="h-11 w-full rounded-xl border border-input bg-background px-3"
              >
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
                <option value="SNACK">Snack</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="foodName">Food</Label>
            <Input id="foodName" name="foodName" placeholder="Greek yogurt, salmon..." required />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input id="calories" name="calories" type="number" min="0" step="1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protein</Label>
              <Input id="protein" name="protein" type="number" min="0" step="0.1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs</Label>
              <Input id="carbs" name="carbs" type="number" min="0" step="0.1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Fat</Label>
              <Input id="fat" name="fat" type="number" min="0" step="0.1" />
            </div>
          </div>
          <Button disabled={pending}>{pending ? "Saving..." : "Add Meal"}</Button>
        </form>
      </Card>
      <Card>
        <form action={saveWater} className="space-y-4">
          <CardHeader>
            <CardTitle>Water</CardTitle>
            <CardDescription>Keep a quiet record of hydration.</CardDescription>
          </CardHeader>
          <input type="hidden" name="waterDate" value={today} />
          <div className="space-y-2">
            <Label htmlFor="waterMl">Milliliters</Label>
            <Input
              id="waterMl"
              name="waterMl"
              type="number"
              min="0"
              defaultValue={waterMl || 0}
            />
          </div>
          <Button disabled={pending} variant="outline">
            Save Water
          </Button>
        </form>
      </Card>
      {error ? <p className="text-sm text-destructive lg:col-span-2">{error}</p> : null}
      {message ? <p className="text-sm text-muted-foreground lg:col-span-2">{message}</p> : null}
    </div>
  );
}
