"use client";

import { useState, useTransition } from "react";
import { addJournalAction } from "@/lib/actions/journal";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function JournalForm({ today }: { today: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await addJournalAction({
        date: formData.get("date"),
        entry: formData.get("entry"),
        energy: formData.get("energy") || undefined,
        sleep: formData.get("sleep") || undefined,
        recovery: formData.get("recovery") || undefined,
        stress: formData.get("stress") || undefined,
      });
      if (!result.ok) setError(result.error);
      else setError(null);
    });
  }

  return (
    <Card>
      <form action={save} className="space-y-4">
        <CardHeader>
          <CardTitle>Write</CardTitle>
          <CardDescription>Energy, sleep, and the softer language of the day.</CardDescription>
        </CardHeader>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" defaultValue={today} max={today} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="entry">Entry</Label>
          <Textarea id="entry" name="entry" required placeholder="How did the day feel?" />
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
        <Button disabled={pending}>{pending ? "Saving..." : "Save Entry"}</Button>
      </form>
    </Card>
  );
}
