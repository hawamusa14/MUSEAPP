"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startPlannedWorkoutAction } from "@/lib/actions/plans";
import { Button } from "@/components/ui/button";

export function StartPlanButton({
  planId,
  label = "Start workout",
}: {
  planId: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Button
        className="min-h-11"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await startPlannedWorkoutAction({ planId });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push(`/workout/${result.data.workoutId}`);
          })
        }
      >
        {pending ? "Opening..." : label}
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
