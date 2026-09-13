"use client";

import { useState, useTransition } from "react";
import { updateWorkoutCaloriesAction } from "@/lib/actions/workouts";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ActiveCaloriesField({
  workoutId,
  calories,
}: {
  workoutId: string;
  calories: number | null;
}) {
  const [value, setValue] = useState(calories == null ? "" : String(calories));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active calories burned</CardTitle>
        <CardDescription>
          Add the total from this session. Those calories raise today&apos;s food allowance.
        </CardDescription>
      </CardHeader>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="active-calories">Calories</Label>
          <Input
            id="active-calories"
            inputMode="numeric"
            className="min-h-12 text-lg"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="300"
          />
        </div>
        <Button
          type="button"
          className="min-h-12"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await updateWorkoutCaloriesAction({
                workoutId,
                calories: value.trim() === "" ? null : Number(value),
              });
              if (!result.ok) {
                setError(result.error);
                setMessage(null);
                return;
              }
              setError(null);
              setMessage("Saved. Nutrition now includes this burn.");
            })
          }
        >
          {pending ? "Saving..." : "Save burn"}
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}
    </Card>
  );
}
