"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteWorkoutAction } from "@/lib/actions/workouts";
import { Button } from "@/components/ui/button";

export function DeleteWorkoutButton({
  workoutId,
  label = "Delete workout",
  redirectTo,
}: {
  workoutId: string;
  label?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="min-h-11"
        disabled={pending}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!window.confirm("Remove this workout from history, calendar, and analytics?")) {
            return;
          }
          startTransition(async () => {
            const result = await deleteWorkoutAction({ workoutId });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            if (redirectTo) {
              router.push(redirectTo);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Removing..." : label}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
