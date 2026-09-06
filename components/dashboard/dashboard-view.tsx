import Link from "next/link";
import { muscleGroupLabel } from "@/lib/muscle-groups";
import { firstName, formatDuration, formatLongDate } from "@/lib/dates";
import { summarizeWorkout, workoutElapsedSeconds } from "@/lib/workout-metrics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { WorkoutDetail } from "@/types";

export function DashboardView({
  name,
  workout,
  weight,
  steps,
  nutrition,
  stepGoal,
  calorieTarget,
  proteinTarget,
  prCount = 0,
}: {
  name: string;
  workout: WorkoutDetail | null;
  weight: { weight: number; unit: string } | null;
  steps: { steps: number } | null;
  nutrition: { calories: number; protein: number } | null;
  stepGoal: number;
  calorieTarget: number | null;
  proteinTarget: number | null;
  prCount?: number;
}) {
  const summary = workout ? summarizeWorkout(workout) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">{formatLongDate()}</p>
        <h1 className="mt-1 font-heading text-4xl tracking-tight">
          {greeting()}, {firstName(name)}
        </h1>
        {prCount > 0 ? (
          <p className="mt-3 rounded-2xl bg-accent px-4 py-3 text-sm">
            New personal record{prCount === 1 ? "" : "s"} saved from your last
            session.
          </p>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Workout"
          value={workout ? workout.title : "Rest day"}
          hint={
            workout
              ? `${summary?.exerciseCount} exercises · ${summary?.completedSetCount} sets`
              : "Start when you are ready"
          }
        />
        <Metric
          label="Calories"
          value={
            calorieTarget
              ? `${Math.round(nutrition?.calories ?? 0)} / ${calorieTarget}`
              : `${Math.round(nutrition?.calories ?? 0)}`
          }
          hint="Nutrition tracking is next"
        />
        <Metric
          label="Protein"
          value={
            proteinTarget
              ? `${Math.round(nutrition?.protein ?? 0)}g / ${proteinTarget}g`
              : `${Math.round(nutrition?.protein ?? 0)}g`
          }
        />
        <Metric
          label="Steps"
          value={(steps?.steps ?? 0).toLocaleString()}
          hint={`Goal ${stepGoal.toLocaleString()}`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workout status</CardTitle>
            <CardDescription>
              {workout
                ? workout.status === "IN_PROGRESS"
                  ? "A session is open. Resume exactly where you left off."
                  : "Today’s session is saved."
                : "No workout logged today yet."}
            </CardDescription>
          </CardHeader>
          {workout ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {workout.muscleGroups.map((group) => (
                  <Badge key={group}>{muscleGroupLabel(group)}</Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDuration(workoutElapsedSeconds(workout))} ·{" "}
                {summary?.exerciseCount} exercises · {summary?.setCount} sets
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  render={
                    <Link
                      href={
                        workout.status === "IN_PROGRESS"
                          ? `/workout/${workout.id}`
                          : "/workout"
                      }
                    />
                  }
                >
                  {workout.status === "IN_PROGRESS" ? "Resume workout" : "Start another"}
                </Button>
              </div>
            </div>
          ) : (
            <Button render={<Link href="/workout" />}>Start Workout</Button>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goal progress</CardTitle>
            <CardDescription>
              {weight
                ? `Current weight ${weight.weight} ${weight.unit.toLowerCase()}`
                : "Log a weight to see your trajectory."}
            </CardDescription>
          </CardHeader>
          <Progress value={weight ? 18 : 0} label="Goal progress" />
          <p className="mt-3 text-sm text-muted-foreground">
            Weight goals and projections arrive in the next phase.
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>The connected MUSE ecosystem starts with training.</CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/workout" />}>Start Workout</Button>
          <Button variant="outline" render={<Link href="/nutrition" />}>
            Log Food
          </Button>
          <Button variant="outline" render={<Link href="/progress" />}>
            Log Weight
          </Button>
          <Button variant="outline" render={<Link href="/journal" />}>
            Add Journal
          </Button>
        </div>
      </Card>
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
