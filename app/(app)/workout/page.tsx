import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  getActiveWorkout,
  getOpenLoggedWorkouts,
  getRecentWorkouts,
} from "@/lib/data/workouts";
import { muscleGroupLabel } from "@/lib/muscle-groups";
import { formatDuration, formatShortDate, toInputDate } from "@/lib/dates";
import { StartWorkoutForm } from "@/components/workout/start-workout-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WorkoutPage() {
  const user = await requireUser();
  const [active, drafts, recent] = await Promise.all([
    getActiveWorkout(user.id),
    getOpenLoggedWorkouts(user.id),
    getRecentWorkouts(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">Studio</p>
        <h1 className="mt-2 font-heading text-4xl">Workout</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Start a live session, or log a past workout with its date and exercises.
        </p>
      </header>

      {active ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Session in progress</CardTitle>
            <CardDescription>{active.title}</CardDescription>
          </CardHeader>
          <div className="mb-4 flex flex-wrap gap-2">
            {active.muscleGroups.map((group) => (
              <Badge key={group}>{muscleGroupLabel(group)}</Badge>
            ))}
          </div>
          <Button render={<Link href={`/workout/${active.id}`} />}>
            Resume workout
          </Button>
        </Card>
      ) : null}

      <StartWorkoutForm today={toInputDate()} />

      {drafts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-2xl">Unfinished logs</h2>
          {drafts.map((workout) => (
            <Link key={workout.id} href={`/workout/${workout.id}`} className="block">
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{workout.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatShortDate(workout.date)} · {workout.exercises.length}{" "}
                      exercises
                    </p>
                  </div>
                  <span className="text-sm text-primary">Continue</span>
                </div>
              </Card>
            </Link>
          ))}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Recent</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Completed sessions will gather here.
          </p>
        ) : (
          recent.map((workout) => (
            <Link key={workout.id} href={`/workout/${workout.id}`} className="block">
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{workout.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatShortDate(workout.date)} ·{" "}
                      {formatDuration(workout.durationSeconds ?? 0)} ·{" "}
                      {workout.exercises.length} exercises
                    </p>
                  </div>
                  <span className="text-sm text-primary">View</span>
                </div>
              </Card>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
