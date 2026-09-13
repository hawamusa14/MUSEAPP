"use client";

import { useState } from "react";
import { addJournalAction } from "@/lib/actions/journal";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function JournalForm({ today }: { today: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await addJournalAction({
      date: String(formData.get("date") ?? ""),
      entry: String(formData.get("entry") ?? ""),
      workoutNotes: String(formData.get("workoutNotes") || "") || undefined,
      energy: formData.get("energy") ? Number(formData.get("energy")) : undefined,
      sleep: formData.get("sleep") ? Number(formData.get("sleep")) : undefined,
      recovery: formData.get("recovery") ? Number(formData.get("recovery")) : undefined,
      stress: formData.get("stress") ? Number(formData.get("stress")) : undefined,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Journal saved.");
  }

  return (
    <Card>
      <form action={save} className="space-y-5">
        <CardHeader>
          <CardTitle>Write anything</CardTitle>
          <CardDescription>
            Thoughts on the day, the workout, how you felt — keep as much as you want.
          </CardDescription>
        </CardHeader>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" defaultValue={today} max={today} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="entry">Today</Label>
          <Textarea
            id="entry"
            name="entry"
            required
            className="min-h-40"
            placeholder="How did the day feel? What do you want to remember?"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workoutNotes">Workout and movement</Label>
          <Textarea
            id="workoutNotes"
            name="workoutNotes"
            className="min-h-32"
            placeholder="What you trained, what felt strong, what you want to try next..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="energy">Energy</Label>
            <Input id="energy" name="energy" type="number" min="1" max="10" placeholder="1-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sleep">Sleep</Label>
            <Input id="sleep" name="sleep" type="number" min="1" max="10" placeholder="1-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recovery">Recovery</Label>
            <Input id="recovery" name="recovery" type="number" min="1" max="10" placeholder="1-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stress">Stress</Label>
            <Input id="stress" name="stress" type="number" min="1" max="10" placeholder="1-10" />
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save Entry"}
        </Button>
      </form>
    </Card>
  );
}
