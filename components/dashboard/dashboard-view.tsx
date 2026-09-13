import Link from "next/link";
import { muscleGroupLabel } from "@/lib/muscle-groups";
import { firstName, formatDuration, formatLongDate } from "@/lib/dates";
import { summarizeWorkout, workoutElapsedSeconds } from "@/lib/workout-metrics";
import { canStartPlannedWorkout, formatTimeRange, planKindMeta, type PlanDTO } from "@/lib/planning";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { WorkoutDetail } from "@/types";
import { StartPlanButton } from "@/components/calendar/start-plan-button";

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
  justFinished = false,
  todayPlans = [],
  tomorrowPlans = [],
  weekWorkouts = 0,
  workoutsTarget = null,
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
  justFinished?: boolean;
  todayPlans?: PlanDTO[];
  tomorrowPlans?: PlanDTO[];
  weekWorkouts?: number;
  workoutsTarget?: number | null;
}) {
  const summary = workout ? summarizeWorkout(workout) : null;
  const todaysOpenPlan = todayPlans.find(
    (plan) => plan.status === "PLANNED" && canStartPlannedWorkout(plan.kind)
  );
  const nextPlan = todaysOpenPlan ?? tomorrowPlans[0];
  const todayPlan = todayPlans[0];
  const todayTitle = todayPlan?.title || workout?.title || "Open day";
  const todayDetail = todayPlan
    ? formatTimeRange(todayPlan.startTime, todayPlan.endTime) || "Planned on your calendar"
    : workout
      ? "Logged in the tracker"
      : "Nothing planned yet";

  return (
    <div className="muse-page mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">{formatLongDate()}</p>
        <h1 className="mt-1 font-heading text-4xl tracking-tight">
          {greeting()}, {firstName(name)}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          What are you doing today? What have you accomplished? What should you do next?
        </p>
        {justFinished ? (
          <p className="muse-complete mt-3 rounded-2xl bg-accent px-4 py-3 text-sm">
            Session saved. Your calendar, history, and progress now know about it.
          </p>
        ) : null}
        {prCount > 0 ? (
          <p className="pr-celebrate mt-3 rounded-2xl bg-accent px-4 py-3 text-sm">
            New personal record{prCount === 1 ? "" : "s"} saved from your last session.
          </p>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Today</p>
          <p className="mt-2 font-heading text-2xl">
            {todayTitle}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {todayDetail}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Accomplished</p>
          <p className="mt-2 font-heading text-2xl tabular-nums">
            {workoutsTarget ? `${weekWorkouts} / ${workoutsTarget}` : weekWorkouts} this week
          </p>
          <Progress
            className="mt-3"
            value={workoutsTarget ? Math.min(100, (weekWorkouts / workoutsTarget) * 100) : weekWorkouts > 0 ? 40 : 0}
            label="Weekly workouts"
          />
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Next</p>
          <p className="mt-2 font-heading text-2xl">{nextPlan?.title ?? "Choose a plan"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {nextPlan ? `${nextPlan.date} · ${planKindMeta(nextPlan.kind).label}` : "Open Calendar to plan the week"}
          </p>
          {todaysOpenPlan ? (
            <div className="mt-3">
              <StartPlanButton planId={todaysOpenPlan.id} label="Start this workout" />
            </div>
          ) : (
            <div className="mt-3">
              <Button variant="outline" render={<Link href="/calendar" />}>
                See calendar
              </Button>
            </div>
          )}
        </Card>
      </section>

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
          hint="From today's meals"
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
                : todayPlans.length
                  ? "A planned workout is waiting on your calendar."
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
            <div className="flex flex-wrap gap-3">
              {todaysOpenPlan ? (
                <StartPlanButton planId={todaysOpenPlan.id} label="Start planned workout" />
              ) : (
                <Button render={<Link href="/workout" />}>Start Workout</Button>
              )}
              <Button variant="outline" render={<Link href="/calendar" />}>
                Open calendar
              </Button>
            </div>
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
            Set a weight goal on Goals to turn this into a trajectory.
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Workouts, meals, recovery, and plans stay in one rhythm.</CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/workout" />}>Start Workout</Button>
          <Button variant="outline" render={<Link href="/calendar" />}>
            Plan week
          </Button>
          <Button variant="outline" render={<Link href="/nutrition" />}>
            Log Food
          </Button>
          <Button variant="outline" render={<Link href="/progress" />}>
            Log Weight
          </Button>
          <Button variant="outline" render={<Link href="/ai-coach" />}>
            Ask Coach
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
