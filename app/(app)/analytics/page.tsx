import { requireUser } from "@/lib/auth";
import { getAnalyticsPage } from "@/lib/data/studio";
import { formatShortDate } from "@/lib/dates";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const data = await getAnalyticsPage(user.id);
  const maxVolume = Math.max(1, ...data.volumeByDay.map((item) => item.volume));
  const maxWeight = Math.max(1, ...data.weights.map((item) => item.weight));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">Insight</p>
        <h1 className="mt-2 font-heading text-4xl">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          The last four weeks of training, plus the weight you have logged.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Workouts</p>
          <p className="mt-2 font-heading text-3xl">{data.workoutCount}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Volume</p>
          <p className="mt-2 font-heading text-3xl">{Math.round(data.totalVolume).toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Open goals</p>
          <p className="mt-2 font-heading text-3xl">{data.openGoals}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training volume</CardTitle>
          <CardDescription>Completed workouts in the last 28 days.</CardDescription>
        </CardHeader>
        {data.volumeByDay.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Log a workout to see volume gather here.
          </p>
        ) : (
          <div className="space-y-3">
            {data.volumeByDay.map((item) => (
              <div key={item.date.toISOString()}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{formatShortDate(item.date)} · {item.title}</span>
                  <span className="text-muted-foreground">
                    {Math.round(item.volume).toLocaleString()} · {item.sets} sets
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(8, (item.volume / maxVolume) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weight trend</CardTitle>
          <CardDescription>Your saved weigh-ins, oldest to newest.</CardDescription>
        </CardHeader>
        {data.weights.length === 0 ? (
          <p className="text-sm text-muted-foreground">Log a weight on Progress to start a trend.</p>
        ) : (
          <div className="flex h-40 items-end gap-2">
            {data.weights.map((item) => (
              <div key={item.id} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-primary/80"
                  style={{ height: `${Math.max(12, (item.weight / maxWeight) * 100)}%` }}
                  title={`${item.weight}`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {item.date.getUTCMonth() + 1}/{item.date.getUTCDate()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
