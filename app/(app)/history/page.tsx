import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getWorkoutHistory } from "@/lib/data/workouts";
import { formatDuration, formatShortDate } from "@/lib/dates";
import { Card } from "@/components/ui/card";

export default async function HistoryPage() {
  const user = await requireUser();
  const workouts = await getWorkoutHistory(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">Archive</p>
        <h1 className="mt-2 font-heading text-4xl">History</h1>
        <p className="mt-2 text-muted-foreground">
          Every session you started or saved, newest first.
        </p>
      </header>
      {workouts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No workouts yet.</p>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <Link key={workout.id} href={`/workout/${workout.id}`} className="block">
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{workout.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatShortDate(workout.date)} · {workout.status.toLowerCase()} ·{" "}
                      {formatDuration(workout.durationSeconds ?? 0)} ·{" "}
                      {workout.exercises.length} exercises
                    </p>
                  </div>
                  <span className="text-sm text-primary">View</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
