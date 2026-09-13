import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getHistoryTimeline } from "@/lib/data/history";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NotesImport } from "@/components/workout/notes-import";
import { DeleteWorkoutButton } from "@/components/workout/delete-workout-button";

export default async function HistoryPage() {
  const user = await requireUser();
  const items = await getHistoryTimeline(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">Archive</p>
        <h1 className="mt-2 font-heading text-4xl">History</h1>
        <p className="mt-2 text-muted-foreground">
          Workouts, meals, steps, photos, and notes from the same records used everywhere else.
        </p>
      </header>

      <NotesImport defaultYear={new Date().getFullYear()} />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={`${item.kind}-${item.id}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {item.date} · {item.kind}
                  </p>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.kind === "workout" ? (
                    <DeleteWorkoutButton workoutId={item.id} label="Delete" />
                  ) : null}
                  {item.href ? (
                    <Button variant="ghost" render={<Link href={item.href} />}>
                      View
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
