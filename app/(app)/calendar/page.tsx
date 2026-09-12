import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDayStudio, getMonthStudio } from "@/lib/data/studio";
import {
  formatShortDate,
  monthKey,
  monthLabel,
  shiftMonth,
  toInputDate,
} from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const user = await requireUser();
  const { month, day } = await searchParams;
  const selectedDay = day ?? toInputDate();
  const [monthData, dayData] = await Promise.all([
    getMonthStudio(user.id, month),
    getDayStudio(user.id, selectedDay),
  ]);
  const previous = monthKey(shiftMonth(monthData.start, -1));
  const next = monthKey(shiftMonth(monthData.start, 1));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-primary">Studio</p>
          <h1 className="mt-2 font-heading text-4xl">Calendar</h1>
          <p className="mt-2 text-muted-foreground">
            Workouts, meals, weigh-ins, and journal notes in one month.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/calendar?month=${previous}&day=${selectedDay}`} />}>
            Previous
          </Button>
          <Button variant="outline" render={<Link href={`/calendar?month=${next}&day=${selectedDay}`} />}>
            Next
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{monthLabel(monthData.start)}</CardTitle>
          <CardDescription>A filled day has something logged.</CardDescription>
        </CardHeader>
        <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {WEEKDAYS.map((label) => (
            <div key={label} className="py-2">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {monthData.cells.map((cell, index) => {
            if (!cell) {
              return <div key={`empty-${index}`} />;
            }
            const key = cell.toISOString().slice(0, 10);
            const marks = monthData.marks.get(key);
            const selected = key === selectedDay;
            return (
              <Link
                key={key}
                href={`/calendar?month=${monthKey(monthData.start)}&day=${key}`}
                className={cn(
                  "min-h-20 rounded-2xl border p-2 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                )}
              >
                <p className="text-sm font-medium">{cell.getUTCDate()}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {marks?.workout ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
                  {marks?.nutrition ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> : null}
                  {marks?.journal ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" /> : null}
                  {marks?.weight ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-30" /> : null}
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{formatShortDate(dayData.date)}</CardTitle>
          <CardDescription>Everything logged on this day.</CardDescription>
        </CardHeader>
        <div className="space-y-5">
          <section>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Workouts</p>
            {dayData.workouts.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No workout yet.</p>
            ) : (
              dayData.workouts.map((workout) => (
                <Link key={workout.id} href={`/workout/${workout.id}`} className="mt-2 block">
                  <p className="font-medium">{workout.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {workout.exercises.length} exercises · {workout.status.toLowerCase()}
                  </p>
                </Link>
              ))
            )}
          </section>
          <section>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Nutrition</p>
            {dayData.meals.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No meals yet.</p>
            ) : (
              dayData.meals.map((meal) => (
                <p key={meal.id} className="mt-2 text-sm">
                  {meal.foodName} · {Math.round(meal.calories)} cal
                </p>
              ))
            )}
          </section>
          <section>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Journal</p>
            {dayData.journal.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No journal yet.</p>
            ) : (
              dayData.journal.map((item) => (
                <p key={item.id} className="mt-2 text-sm leading-7 text-muted-foreground">
                  {item.entry}
                </p>
              ))
            )}
          </section>
          {dayData.weight ? (
            <Badge>
              Weight {dayData.weight.weight} {dayData.weight.unit.toLowerCase()}
            </Badge>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
