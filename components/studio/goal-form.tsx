"use client";

import { useState } from "react";
import { addGoalAction } from "@/lib/actions/goals";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GoalForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await addGoalAction({
      type: String(formData.get("type") ?? ""),
      title: String(formData.get("title") ?? ""),
      targetValue: formData.get("targetValue")
        ? Number(formData.get("targetValue"))
        : undefined,
      unit: String(formData.get("unit") || "") || undefined,
      targetDate: String(formData.get("targetDate") || "") || undefined,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Goal saved.");
  }

  return (
    <Card>
      <form action={save} className="space-y-4">
        <CardHeader>
          <CardTitle>New goal</CardTitle>
          <CardDescription>Weight, calories, protein, carbs, steps, or something of your own.</CardDescription>
        </CardHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue="WEIGHT"
              className="h-11 w-full rounded-xl border border-input bg-background px-3"
            >
              <option value="WEIGHT">Weight</option>
              <option value="STRENGTH">Strength</option>
              <option value="STEPS">Steps</option>
              <option value="WORKOUT_FREQUENCY">Workouts / week</option>
              <option value="PROTEIN">Protein</option>
              <option value="CALORIES">Calories</option>
              <option value="CARBS">Carbs</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Reach 135 lb" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetValue">Target</Label>
            <Input id="targetValue" name="targetValue" type="number" min="0" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" name="unit" placeholder="lb, g, days..." />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="targetDate">Target date</Label>
            <Input id="targetDate" name="targetDate" type="date" />
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Add Goal"}
        </Button>
      </form>
    </Card>
  );
}
