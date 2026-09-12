import { requireUser } from "@/lib/auth";
import { getProgressPage } from "@/lib/data/studio";
import { formatShortDate, toInputDate } from "@/lib/dates";
import { ProgressForms } from "@/components/studio/progress-forms";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProgressPage() {
  const user = await requireUser();
  const data = await getProgressPage(user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">Body</p>
        <h1 className="mt-2 font-heading text-4xl">Progress</h1>
        <p className="mt-2 text-muted-foreground">
          Weight, measurements, and steps — the quieter record of change.
        </p>
      </header>

      <ProgressForms today={toInputDate()} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Weight history</CardTitle>
          </CardHeader>
          {data.weights.length === 0 ? (
            <p className="text-sm text-muted-foreground">No weigh-ins yet.</p>
          ) : (
            <div className="space-y-3">
              {data.weights.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{formatShortDate(item.date)}</span>
                  <span>
                    {item.weight} {item.unit.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Measurements</CardTitle>
          </CardHeader>
          {data.measurements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No measurements yet.</p>
          ) : (
            <div className="space-y-3">
              {data.measurements.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} · {formatShortDate(item.date)}
                  </span>
                  <span>
                    {item.value} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Steps</CardTitle>
          </CardHeader>
          {data.steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No step counts yet.</p>
          ) : (
            <div className="space-y-3">
              {data.steps.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{formatShortDate(item.date)}</span>
                  <span>{item.steps.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
