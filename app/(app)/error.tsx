"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="font-heading text-3xl">Something went wrong</h1>
      <p className="text-muted-foreground">
        {error.message.includes("DATABASE_URL")
          ? "Add DATABASE_URL and your Clerk keys to .env.local, then run prisma migrate and seed."
          : "Unable to load this part of MUSE. You can try again."}
      </p>
      <Button onClick={reset}>Retry</Button>
    </div>
  );
}
