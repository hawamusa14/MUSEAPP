"use client";

import { useTransition } from "react";
import { completeGoalAction } from "@/lib/actions/goals";
import { Button } from "@/components/ui/button";

export function CompleteGoalButton({
  goalId,
  completed,
}: {
  goalId: string;
  completed: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => completeGoalAction({ goalId }))}
    >
      {completed ? "Reopen" : "Mark done"}
    </Button>
  );
}
