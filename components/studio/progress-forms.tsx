"use client";

import { useState } from "react";
import {
  addMeasurementAction,
  addStepsAction,
  addWeightAction,
} from "@/lib/actions/progress";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProgressForms({ today }: { today: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(
    action: (input: unknown) => Promise<{ ok: true } | { ok: false; error: string }>,
    input: unknown,
    success: string
  ) {
    setPending(true);
    const result = await action(input);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      setMessage(null);
      return;
    }
    setError(null);
    setMessage(success);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <form
          className="space-y-4"
          action={(formData) =>
            run(
              addWeightAction,
              {
                date: String(formData.get("weightDate") ?? ""),
                weight: Number(formData.get("weight")),
                notes: String(formData.get("notes") || "") || undefined,
              },
              "Weight saved."
            )
          }
        >
          <CardHeader>
            <CardTitle>Weight</CardTitle>
            <CardDescription>Log a weigh-in for any day.</CardDescription>
          </CardHeader>
          <div className="space-y-2">
            <Label htmlFor="weightDate">Date</Label>
            <Input id="weightDate" name="weightDate" type="date" defaultValue={today} max={today} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Weight</Label>
            <Input id="weight" name="weight" type="number" min="1" step="0.1" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Morning, after travel..." />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Weight"}
          </Button>
        </form>
      </Card>
      <Card>
        <form
          className="space-y-4"
          action={(formData) =>
            run(
              addMeasurementAction,
              {
                date: String(formData.get("measureDate") ?? ""),
                name: String(formData.get("name") ?? ""),
                value: Number(formData.get("value")),
                unit: String(formData.get("unit") || "in"),
              },
              "Measurement saved."
            )
          }
        >
          <CardHeader>
            <CardTitle>Measurement</CardTitle>
            <CardDescription>Waist, hips, arms, or whatever you track.</CardDescription>
          </CardHeader>
          <div className="space-y-2">
            <Label htmlFor="measureDate">Date</Label>
            <Input id="measureDate" name="measureDate" type="date" defaultValue={today} max={today} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Waist" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input id="value" name="value" type="number" min="0" step="0.1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" name="unit" defaultValue="in" />
            </div>
          </div>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Saving..." : "Save Measurement"}
          </Button>
        </form>
      </Card>
      <Card>
        <form
          className="space-y-4"
          action={(formData) =>
            run(
              addStepsAction,
              {
                date: String(formData.get("stepDate") ?? ""),
                steps: Number(formData.get("steps")),
              },
              "Steps saved."
            )
          }
        >
          <CardHeader>
            <CardTitle>Steps</CardTitle>
            <CardDescription>A simple daily count.</CardDescription>
          </CardHeader>
          <div className="space-y-2">
            <Label htmlFor="stepDate">Date</Label>
            <Input id="stepDate" name="stepDate" type="date" defaultValue={today} max={today} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="steps">Steps</Label>
            <Input id="steps" name="steps" type="number" min="0" required />
          </div>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Saving..." : "Save Steps"}
          </Button>
        </form>
      </Card>
      {error ? <p className="text-sm text-destructive lg:col-span-3">{error}</p> : null}
      {message ? <p className="text-sm text-muted-foreground lg:col-span-3">{message}</p> : null}
    </div>
  );
}
