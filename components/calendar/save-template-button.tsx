"use client";

import { useState, useTransition } from "react";
import { saveWorkoutAsTemplateAction } from "@/lib/actions/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SaveTemplateButton({
  workoutId,
  title,
  label = "Save as template",
  showNameField = true,
}: {
  workoutId: string;
  title?: string;
  label?: string;
  showNameField?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(title || "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {showNameField ? (
        <div className="space-y-1">
          <Label htmlFor={`template-name-${workoutId}`}>Template name</Label>
          <Input
            id={`template-name-${workoutId}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={title || "Template name"}
          />
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={pending || !name.trim()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          startTransition(async () => {
            const result = await saveWorkoutAsTemplateAction({
              workoutId,
              title: name.trim() || title,
            });
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
