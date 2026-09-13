"use client";

import { useState } from "react";
import { addNutritionEntryAction, saveWaterAction } from "@/lib/actions/nutrition";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NutritionForm({ today, waterMl }: { today: string; waterMl: number }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function saveMeal(formData: FormData) {
    setPending(true);
    const result = await addNutritionEntryAction({
      date: String(formData.get("date") ?? ""),
      mealType: String(formData.get("mealType") ?? ""),
      foodName: String(formData.get("foodName") ?? ""),
      calories: Number(formData.get("calories")),
      protein: Number(formData.get("protein") || 0),
      carbs: Number(formData.get("carbs") || 0),
      fat: Number(formData.get("fat") || 0),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      setMessage(null);
      return;
    }
    setError(null);
    setMessage("Meal saved.");
  }

  async function saveWater(formData: FormData) {
    setPending(true);
    const result = await saveWaterAction({
      date: String(formData.get("waterDate") ?? ""),
      waterMl: Number(formData.get("waterMl")),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setMessage("Water updated.");
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
          <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Add Meal"}</Button>
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
          <Button type="submit" variant="outline" disabled={pending}>
            Save Water
          </Button>
        </form>
      </Card>
      {error ? <p className="text-sm text-destructive lg:col-span-2">{error}</p> : null}
      {message ? <p className="text-sm text-muted-foreground lg:col-span-2">{message}</p> : null}
    </div>
  );
}
