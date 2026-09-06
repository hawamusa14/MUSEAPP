"use client";

import { useEffect, useState, useTransition } from "react";
import { pauseWorkoutAction, resumeWorkoutAction } from "@/lib/actions/workouts";
import { formatDuration } from "@/lib/dates";
import { workoutElapsedSeconds } from "@/lib/workout-metrics";
import { Button } from "@/components/ui/button";

export function WorkoutTimer({
  workoutId,
  startedAt,
  pausedAt,
  pausedMs,
}: {
  workoutId: string;
  startedAt: Date;
  pausedAt: Date | null;
  pausedMs: number;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (pausedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [pausedAt]);

  const seconds = workoutElapsedSeconds({
    startedAt,
    pausedAt,
    pausedMs,
    endedAt: pausedAt ?? new Date(now),
  });

  return (
    <div className="flex items-center gap-3">
      <p className="font-heading text-3xl tabular-nums" aria-live="polite">
        {formatDuration(seconds)}
      </p>
      {pausedAt ? (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await resumeWorkoutAction({ workoutId });
            })
          }
        >
          Resume
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await pauseWorkoutAction({ workoutId });
            })
          }
        >
          Pause
        </Button>
      )}
    </div>
  );
}
