import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  getActiveWorkout,
  getOpenLoggedWorkouts,
  getRecentWorkouts,
} from "@/lib/data/workouts";
import { getPlansForDate, serializePlan } from "@/lib/data/plans";
import { StartPlanButton } from "@/components/calendar/start-plan-button";
import { formatTimeRange, planKindMeta } from "@/lib/planning";
import { muscleGroupLabel } from "@/lib/muscle-groups";
import { formatDuration, formatShortDate, toDateOnly, toInputDate } from "@/lib/dates";
import { StartWorkoutForm } from "@/components/workout/start-workout-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SaveTemplateButton } from "@/components/calendar/save-template-button";
import { NotesImport } from "@/components/workout/notes-import";
import { DeleteWorkoutButton } from "@/components/workout/delete-workout-button";

export default async function WorkoutPage() {
  const user = await requireUser();
  const [active, drafts, recent, todayPlans] = await Promise.all([
    getActiveWorkout(user.id),
    getOpenLoggedWorkouts(user.id),
    getRecentWorkouts(user.id),
    getPlansForDate(user.id, toDateOnly()),
  ]);
  const planned = todayPlans.map(serializePlan).filter((plan) => plan.status === "PLANNED");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">Studio</p>
        <h1 className="mt-2 font-heading text-4xl">Workout</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Start a live session, or log a past workout with its date and exercises.
        </p>
      </header>

      {planned.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-2xl">Planned for today</h2>
          {planned.map((plan) => (
            <Card key={plan.id} className="border-primary/25">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {planKindMeta(plan.kind).icon} {plan.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatTimeRange(plan.startTime, plan.endTime) ?? "Flexible time"}
                    {plan.exercises.length ? ` · ${plan.exercises.length} exercises` : ""}
                  </p>
                </div>
                <StartPlanButton
                  planId={plan.id}
                  label={plan.workoutStatus === "IN_PROGRESS" ? "Resume workout" : "Start workout"}
                />
              </div>
            </Card>
          ))}
        </section>
      ) : null}

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

      <NotesImport defaultYear={new Date().getFullYear()} />

      {drafts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-2xl">Unfinished logs</h2>
          {drafts.map((workout) => (
            <Card key={workout.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/workout/${workout.id}`} className="min-w-0">
                  <p className="font-medium">{workout.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatShortDate(workout.date)} · {workout.exercises.length}{" "}
                    exercises
                  </p>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <DeleteWorkoutButton workoutId={workout.id} label="Delete" />
                  <Button variant="ghost" render={<Link href={`/workout/${workout.id}`} />}>
                    Continue
                  </Button>
                </div>
              </div>
            </Card>
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
            <Card key={workout.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/workout/${workout.id}`} className="min-w-0">
                  <p className="font-medium">{workout.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatShortDate(workout.date)} ·{" "}
                    {formatDuration(workout.durationSeconds ?? 0)} ·{" "}
                    {workout.exercises.length} exercises
                  </p>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  {workout.exercises.length > 0 ? (
                    <SaveTemplateButton workoutId={workout.id} title={workout.title} showNameField={false} />
                  ) : null}
                  <DeleteWorkoutButton workoutId={workout.id} label="Delete" />
                  <Button variant="ghost" render={<Link href={`/workout/${workout.id}`} />}>
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
