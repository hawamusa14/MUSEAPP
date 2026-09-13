"use client";

import { useState, useTransition } from "react";
import { updateMacroGoalsAction } from "@/lib/actions/goals";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MacroGoalsForm({
  calorieTarget,
  proteinTarget,
  carbsTarget,
  fatTarget,
}: {
  calorieTarget: number | null;
  proteinTarget: number | null;
  carbsTarget: number | null;
  fatTarget: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await updateMacroGoalsAction({
              calorieTarget: emptyToNull(form.get("calorieTarget")),
              proteinTarget: emptyToNull(form.get("proteinTarget")),
              carbsTarget: emptyToNull(form.get("carbsTarget")),
              fatTarget: emptyToNull(form.get("fatTarget")),
            });
            if (!result.ok) {
              setError(result.error);
              setMessage(null);
              return;
            }
            setError(null);
            setMessage("Macro goals saved. Burned calories add to your daily allowance.");
          });
        }}
      >
        <CardHeader>
          <CardTitle>Daily macros</CardTitle>
          <CardDescription>
            Calories, protein, and carbs. Training calories add on top of the calorie goal.
          </CardDescription>
        </CardHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="calorieTarget">Calories</Label>
            <Input id="calorieTarget" name="calorieTarget" type="number" min="0" defaultValue={calorieTarget ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proteinTarget">Protein (g)</Label>
            <Input id="proteinTarget" name="proteinTarget" type="number" min="0" defaultValue={proteinTarget ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbsTarget">Carbs (g)</Label>
            <Input id="carbsTarget" name="carbsTarget" type="number" min="0" defaultValue={carbsTarget ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fatTarget">Fat (g)</Label>
            <Input id="fatTarget" name="fatTarget" type="number" min="0" defaultValue={fatTarget ?? ""} />
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button type="submit" className="min-h-11" disabled={pending}>
          {pending ? "Saving..." : "Save macro goals"}
        </Button>
      </form>
    </Card>
  );
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return Number(text);
}
