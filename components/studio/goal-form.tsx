"use client";

import { useState, useTransition } from "react";
import { addGoalAction } from "@/lib/actions/goals";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GoalForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await addGoalAction({
        type: formData.get("type"),
        title: formData.get("title"),
        targetValue: formData.get("targetValue") || undefined,
        unit: formData.get("unit") || undefined,
        targetDate: formData.get("targetDate") || undefined,
      });
      if (!result.ok) setError(result.error);
      else setError(null);
    });
  }

  return (
    <Card>
      <form action={save} className="space-y-4">
        <CardHeader>
          <CardTitle>New goal</CardTitle>
          <CardDescription>Weight, protein, steps, or something of your own.</CardDescription>
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
        <Button disabled={pending}>{pending ? "Saving..." : "Add Goal"}</Button>
      </form>
    </Card>
  );
}
