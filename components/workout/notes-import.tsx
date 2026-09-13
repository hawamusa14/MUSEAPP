"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importWorkoutNotesAction } from "@/lib/actions/notes-import";
import { parseWorkoutNotes, summarizeParsedWorkouts } from "@/lib/notes-import";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function NotesImport({ defaultYear }: { defaultYear: number }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [year, setYear] = useState(String(defaultYear));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const workouts = useMemo(
    () => parseWorkoutNotes(text, Number(year) || defaultYear),
    [text, year, defaultYear]
  );
  const summary = summarizeParsedWorkouts(workouts);

  function importNotes() {
    startTransition(async () => {
      const result = await importWorkoutNotesAction({ workouts });
      if (!result.ok) {
        setError(result.error);
        setMessage(null);
        return;
      }
      setError(null);
      setMessage(
        result.data.imported
          ? `Saved ${result.data.imported} workout${result.data.imported === 1 ? "" : "s"} to history, calendar, and analytics.`
          : "Those sessions were already imported."
      );
      if (result.data.skipped) {
        setMessage((current) =>
          `${current || ""} ${result.data.skipped} already existed and were skipped.`.trim()
        );
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paste from Notes</CardTitle>
        <CardDescription>
          Drop in a dated workout log. Review the preview, then MUSE writes completed sessions to Calendar, History, and Analytics.
        </CardDescription>
      </CardHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes-year">Year for dates like 04/02</Label>
          <input
            id="notes-year"
            inputMode="numeric"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="h-11 w-32 rounded-xl border border-input bg-background px-3"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes-paste">Notes</Label>
          <textarea
            id="notes-paste"
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="min-h-44 w-full rounded-2xl border border-input bg-background px-3 py-3"
            placeholder={"04/02\nArm day\nBicep curls\tWarm up = 10lbs, working set = 15lbs"}
          />
        </div>
        {summary.length > 0 ? (
          <div className="space-y-2 rounded-2xl border border-primary/25 bg-accent/40 p-4">
            <p className="text-sm font-medium">Preview · {summary.length} workout{summary.length === 1 ? "" : "s"}</p>
            <ul className="space-y-2 text-sm">
              {summary.map((item) => (
                <li key={item.date}>
                  <span className="font-medium">{item.date}</span>
                  {" · "}
                  {item.title}
                  {" · "}
                  {item.exerciseCount} exercises, {item.setCount} sets
                  {item.highlight ? ` · ${item.highlight}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : text.trim() ? (
          <p className="text-sm text-muted-foreground">
            No dated workouts found yet. Use lines like 04/02, then the exercise and weight.
          </p>
        ) : null}
        <Button
          className="min-h-12 w-full sm:w-auto"
          disabled={pending || workouts.length === 0}
          onClick={importNotes}
        >
          {pending ? "Saving..." : "Save these workouts"}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </Card>
  );
}
