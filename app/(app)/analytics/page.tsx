import { requireUser } from "@/lib/auth";
import { getAnalyticsPage } from "@/lib/data/studio";
import { ExerciseTrendChart } from "@/components/studio/exercise-trend-chart";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const data = await getAnalyticsPage(user.id);
  const unit = (user.settings?.weightUnit ?? "LB").toLowerCase();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">Insight</p>
        <h1 className="mt-2 font-heading text-4xl">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          See how each exercise has grown — month by month, lift by lift.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Workouts</p>
          <p className="mt-2 font-sans text-3xl tabular-nums">{data.workoutCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">Completed in the last 28 days</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Open goals</p>
          <p className="mt-2 font-sans text-3xl tabular-nums">{data.openGoals}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exercise progress</CardTitle>
          <CardDescription>
            Heaviest weight logged for each movement, so you can see the climb over time.
          </CardDescription>
        </CardHeader>
        {data.exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Finish a workout with weights to start these graphs.
          </p>
        ) : (
          <div className="space-y-10">
            {data.exercises.map((exercise) => (
              <ExerciseTrendChart key={exercise.exerciseId} exercise={exercise} unit={unit} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
