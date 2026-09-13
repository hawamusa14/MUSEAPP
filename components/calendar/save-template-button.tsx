"use client";

import { useState, useTransition } from "react";
import { saveWorkoutAsTemplateAction } from "@/lib/actions/plans";
import { Button } from "@/components/ui/button";

export function SaveTemplateButton({
  workoutId,
  title,
  label = "Save as template",
}: {
  workoutId: string;
  title?: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={pending}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          startTransition(async () => {
            const result = await saveWorkoutAsTemplateAction({ workoutId, title });
            if (!result.ok) {
              setError(result.error);
              setMessage(null);
              return;
            }
            setError(null);
            setMessage("Saved. Add it to any day from Calendar.");
          });
        }}
      >
        {pending ? "Saving..." : label}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
