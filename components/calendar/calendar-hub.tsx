"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  applyTemplateAction,
  completePlanAction,
  deletePlanAction,
  deleteRecurringAction,
  deleteTemplateAction,
  movePlanAction,
  savePlanAsTemplateAction,
  skipPlanAction,
  startPlannedWorkoutAction,
} from "@/lib/actions/plans";
import {
  canStartPlannedWorkout,
  formatTimeRange,
  isRecoveryKind,
  planKindMeta,
  planStatusLabel,
  WEEKDAY_LABELS,
  type CalendarHubDTO,
  type PlanDTO,
} from "@/lib/planning";
import { PlanForm } from "@/components/calendar/plan-form";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const WEEKDAYS_SUN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarHub({ data }: { data: CalendarHubDTO }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PlanDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const selected = data.marks[data.selectedDay];

  function href(next: Partial<{ view: string; month: string; week: string; day: string }>) {
    const params = new URLSearchParams({
      view: next.view ?? data.view,
      month: next.month ?? data.month,
      week: next.week ?? data.week,
      day: next.day ?? data.selectedDay,
    });
    return `/calendar?${params.toString()}`;
  }

  function notice(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }

  function run(action: () => Promise<{ ok: true; data?: unknown } | { ok: false; error: string }>, success?: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (success) notice(success);
      router.refresh();
    });
  }

  return (
    <div className="muse-page mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-primary">Planning hub</p>
          <h1 className="mt-2 font-heading text-4xl">How will you move?</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Plan training, recovery, and check-ins. Start a planned workout and MUSE opens the tracker with those exercises waiting.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={data.view === "month" ? "default" : "outline"} render={<Link href={href({ view: "month" })} />}>
            Month
          </Button>
          <Button variant={data.view === "week" ? "default" : "outline"} render={<Link href={href({ view: "week" })} />}>
            Week
          </Button>
          <Button
            className="min-h-11"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Plan workout
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <GoalPulse
          label="This week"
          value={
            data.goals.workoutsTarget
              ? `${data.goals.workoutsDone} / ${data.goals.workoutsTarget}`
              : `${data.goals.workoutsDone}`
          }
          hint="Workouts completed"
          ratio={
            data.goals.workoutsTarget
              ? Math.min(100, (data.goals.workoutsDone / data.goals.workoutsTarget) * 100)
              : data.goals.workoutsDone > 0
                ? 40
                : 0
          }
        />
        <GoalPulse
          label="Steps"
          value={`${data.goals.steps.toLocaleString()} / ${data.goals.stepGoal.toLocaleString()}`}
          ratio={Math.min(100, (data.goals.steps / Math.max(data.goals.stepGoal, 1)) * 100)}
        />
        <GoalPulse
          label="Protein"
          value={
            data.goals.proteinTarget
              ? `${Math.round(data.goals.protein)}g / ${data.goals.proteinTarget}g`
              : `${Math.round(data.goals.protein)}g`
          }
          ratio={
            data.goals.proteinTarget
              ? Math.min(100, (data.goals.protein / data.goals.proteinTarget) * 100)
              : 0
          }
        />
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{data.view === "week" ? data.weekLabel : data.monthLabel}</CardTitle>
            <CardDescription>
              Outlined days are planned. Filled checks are completed. Recovery stays softer than strength.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {data.view === "week" ? (
              <>
                <Button variant="outline" render={<Link href={href({ week: shiftIso(data.week, -7), day: shiftIso(data.selectedDay, -7) })} />}>
                  Previous
                </Button>
                <Button variant="outline" render={<Link href={href({ week: shiftIso(data.week, 7), day: shiftIso(data.selectedDay, 7) })} />}>
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" render={<Link href={href({ month: shiftMonthKey(data.month, -1) })} />}>
                  Previous
                </Button>
                <Button variant="outline" render={<Link href={href({ month: shiftMonthKey(data.month, 1) })} />}>
                  Next
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        {data.view === "week" ? (
          <WeekBoard
            data={data}
            href={href}
            pending={pending}
            onMove={(planId, date) => run(() => movePlanAction({ planId, date }), "Workout moved")}
          />
        ) : (
          <MonthGrid data={data} href={href} />
        )}
      </Card>

      <DayPanel
        data={data}
        selected={selected}
        pending={pending}
        onCreate={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onEdit={(plan) => {
          setEditing(plan);
          setFormOpen(true);
        }}
        onStart={(planId) =>
          startTransition(async () => {
            const result = await startPlannedWorkoutAction({ planId });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push(`/workout/${result.data.workoutId}`);
          })
        }
        onComplete={(planId) => run(() => completePlanAction({ planId }), "Marked complete")}
        onSkip={(planId) => run(() => skipPlanAction({ planId }), "Skipped")}
        onDelete={(planId, scope) => run(() => deletePlanAction({ planId, scope }), "Removed")}
        onTemplate={(planId) => run(() => savePlanAsTemplateAction({ planId }), "Saved as template")}
        onMove={(planId, date) => run(() => movePlanAction({ planId, date }), "Rescheduled")}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Save a favorite session, then drop it onto any date.</CardDescription>
          </CardHeader>
          {data.templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Save any planned workout as a template.</p>
          ) : (
            <ul className="space-y-3">
              {data.templates.map((template) => (
                <li key={template.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-3 py-3">
                  <div>
                    <p className="font-medium">{template.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {template.exercises.length} exercises
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="min-h-11"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () => applyTemplateAction({ templateId: template.id, date: data.selectedDay }),
                          "Template added"
                        )
                      }
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => run(() => deleteTemplateAction({ templateId: template.id }))}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recurring rhythm</CardTitle>
            <CardDescription>Weekly patterns stay visible so recovery has a place too.</CardDescription>
          </CardHeader>
          {data.recurrences.filter((item) => item.isActive).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              When you create a workout, choose Repeat to keep a weekly rhythm.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.recurrences
                .filter((item) => item.isActive)
                .map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-3 py-3">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Every {item.intervalWeeks === 1 ? "" : `${item.intervalWeeks} weeks on `}
                        {WEEKDAY_LABELS[item.weekday]}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        run(() => deleteRecurringAction({ id: item.id, deleteFuture: true }), "Schedule cleared")
                      }
                    >
                      Stop
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {toast ? (
        <div className="muse-toast fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg lg:bottom-8">
          {toast}
        </div>
      ) : null}

      {formOpen ? (
        <PlanForm
          date={data.selectedDay}
          plan={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function GoalPulse({
  label,
  value,
  hint,
  ratio,
}: {
  label: string;
  value: string;
  hint?: string;
  ratio: number;
}) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-2xl tabular-nums">{value}</p>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      <Progress value={ratio} label={label} className="mt-3" />
    </Card>
  );
}

function MonthGrid({
  data,
  href,
}: {
  data: CalendarHubDTO;
  href: (next: Partial<{ day: string }>) => string;
}) {
  return (
    <div className="muse-calendar-month">
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:gap-2 sm:text-xs">
        {WEEKDAYS_SUN.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {data.monthCells.map((key, index) => {
          if (!key) return <div key={`empty-${index}`} />;
          const mark = data.marks[key];
          const selected = key === data.selectedDay;
          const isToday = key === data.today;
          return (
            <Link
              key={key}
              href={href({ day: key })}
              className={cn(
                "min-h-16 rounded-2xl border p-1.5 text-left transition-all duration-300 sm:min-h-24 sm:p-2",
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border hover:bg-accent",
                isToday && !selected ? "ring-1 ring-primary/40" : ""
              )}
            >
              <p className="text-sm font-medium">{Number(key.slice(-2))}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {mark?.hasCompletedWorkout ? <span className="text-[10px]">✓</span> : null}
                {mark?.hasPlanned && !mark.hasCompletedWorkout ? (
                  <span className={cn("size-1.5 rounded-full border", selected ? "border-current" : "border-primary/70")} />
                ) : null}
                {mark?.hasRest ? <span className="text-[10px] opacity-70">☁️</span> : null}
                {mark?.hasCardio ? <span className="text-[10px]">🔥</span> : null}
                {mark?.hasNutrition ? <span className="size-1.5 rounded-full bg-current/50" /> : null}
                {mark?.hasPhoto ? <span className="text-[10px]">📷</span> : null}
              </div>
              <p className="mt-1 hidden truncate text-[11px] opacity-80 sm:block">
                {mark?.plans[0]?.title ?? mark?.workoutTitles[0] ?? ""}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function WeekBoard({
  data,
  href,
  pending,
  onMove,
}: {
  data: CalendarHubDTO;
  href: (next: Partial<{ day: string }>) => string;
  pending: boolean;
  onMove: (planId: string, date: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {data.weekDays.map((key) => {
        const mark = data.marks[key];
        const selected = key === data.selectedDay;
        return (
          <div
            key={key}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const planId = event.dataTransfer.getData("text/plan-id");
              if (planId) onMove(planId, key);
            }}
            className={cn(
              "min-h-36 rounded-2xl border p-3 transition-colors",
              selected ? "border-primary bg-accent/70" : "border-border"
            )}
          >
            <Link href={href({ day: key })} className="block">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {WEEKDAYS_MON[data.weekDays.indexOf(key)]}
              </p>
              <p className="font-heading text-2xl">{Number(key.slice(-2))}</p>
            </Link>
            <div className="mt-3 space-y-2">
              {(mark?.plans ?? []).map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  draggable={!pending}
                  onDragStart={(event) => event.dataTransfer.setData("text/plan-id", plan.id)}
                  onClick={() => {
                    window.location.href = href({ day: key });
                  }}
                  className={cn(
                    "w-full rounded-xl border px-2 py-2 text-left text-sm",
                    plan.status === "COMPLETED"
                      ? "border-primary bg-primary/10"
                      : isRecoveryKind(plan.kind)
                        ? "border-dashed border-primary/40 bg-background"
                        : "border-primary/30 bg-background"
                  )}
                >
                  <span className="mr-1">{planKindMeta(plan.kind).icon}</span>
                  {plan.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayPanel({
  data,
  selected,
  pending,
  onCreate,
  onEdit,
  onStart,
  onComplete,
  onSkip,
  onDelete,
  onTemplate,
  onMove,
}: {
  data: CalendarHubDTO;
  selected?: CalendarHubDTO["marks"][string];
  pending: boolean;
  onCreate: () => void;
  onEdit: (plan: PlanDTO) => void;
  onStart: (planId: string) => void;
  onComplete: (planId: string) => void;
  onSkip: (planId: string) => void;
  onDelete: (planId: string, scope?: "one" | "future") => void;
  onTemplate: (planId: string) => void;
  onMove: (planId: string, date: string) => void;
}) {
  const day = data.day;
  const label = useMemo(() => prettyDate(day.date), [day.date]);

  return (
    <Card className="muse-day-panel">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>Today’s schedule, activity, nutrition, and notes in one place.</CardDescription>
      </CardHeader>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Today’s schedule</h3>
          <Button variant="outline" className="min-h-11" onClick={onCreate}>
            Add
          </Button>
        </div>
        {day.plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing planned. Add a session, a walk, or a rest day.</p>
        ) : (
          day.plans.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "rounded-2xl border p-4",
                plan.status === "COMPLETED"
                  ? "border-primary/50 bg-accent"
                  : isRecoveryKind(plan.kind)
                    ? "border-dashed border-primary/35"
                    : "border-primary/25 bg-background"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {formatTimeRange(plan.startTime, plan.endTime) ?? "Flexible time"}
                  </p>
                  <h4 className="font-heading text-2xl">
                    {planKindMeta(plan.kind).icon} {plan.title}
                  </h4>
                  <Badge className="mt-2">{planStatusLabel(plan.status)}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canStartPlannedWorkout(plan.kind) && plan.status === "PLANNED" ? (
                    <Button className="min-h-11" disabled={pending} onClick={() => onStart(plan.id)}>
                      {plan.workoutStatus === "IN_PROGRESS" ? "Resume workout" : "Start workout"}
                    </Button>
                  ) : null}
                  <Button variant="outline" className="min-h-11" disabled={pending} onClick={() => onEdit(plan)}>
                    Edit
                  </Button>
                </div>
              </div>
              {plan.exercises.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {plan.exercises.map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">
                        {item.targetSets ?? "—"} × {item.targetReps ?? "—"}
                        {item.targetWeight ? ` @ ${item.targetWeight}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" disabled={pending} onClick={() => onComplete(plan.id)}>
                  {plan.status === "COMPLETED" ? "Mark planned" : "Mark complete"}
                </Button>
                <Button variant="ghost" size="sm" disabled={pending} onClick={() => onTemplate(plan.id)}>
                  Save as template
                </Button>
                <Button variant="ghost" size="sm" disabled={pending} onClick={() => onSkip(plan.id)}>
                  Skip
                </Button>
                <label className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
                  Move
                  <input
                    type="date"
                    className="h-11 rounded-xl border border-input bg-background px-2"
                    defaultValue={plan.date}
                    onChange={(event) => onMove(plan.id, event.target.value)}
                  />
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => onDelete(plan.id, plan.recurrenceId ? "one" : undefined)}
                >
                  Delete
                </Button>
                {plan.recurrenceId ? (
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => onDelete(plan.id, "future")}>
                    Delete future
                  </Button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Today’s activity</h3>
          <p className="mt-2 text-sm">Steps: {day.steps?.toLocaleString() ?? "—"} / {day.stepGoal.toLocaleString()}</p>
          <p className="text-sm">Active calories: {day.activeCalories ?? "—"}</p>
          <p className="text-sm">
            Cardio:{" "}
            {day.cardio.length
              ? day.cardio.map((item) => `${item.durationMin} min ${item.type}`).join(", ")
              : selected?.hasCardio
                ? "Planned"
                : "—"}
          </p>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Nutrition</h3>
          <p className="mt-2 text-sm">
            Calories: {Math.round(day.nutrition?.calories ?? 0)}
            {day.calorieTarget ? ` / ${day.calorieTarget}` : ""}
          </p>
          <p className="text-sm">
            Protein: {Math.round(day.nutrition?.protein ?? 0)}g
            {day.proteinTarget ? ` / ${day.proteinTarget}g` : ""}
          </p>
          <p className="text-sm">
            Carbs: {Math.round(day.nutrition?.carbs ?? 0)}g
            {day.carbsTarget ? ` / ${day.carbsTarget}g` : ""}
          </p>
          <p className="text-sm">
            Fat: {Math.round(day.nutrition?.fat ?? 0)}g
            {day.fatTarget ? ` / ${day.fatTarget}g` : ""}
          </p>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Notes</h3>
        {day.notes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No notes for this date yet.</p>
        ) : (
          day.notes.map((note) => (
            <p key={note} className="mt-2 text-sm leading-7 text-muted-foreground">
              “{note}”
            </p>
          ))
        )}
        {day.photoCount > 0 ? (
          <p className="mt-3 text-sm">📷 {day.photoCount} progress photo{day.photoCount === 1 ? "" : "s"}</p>
        ) : null}
        {day.workouts.length > 0 ? (
          <div className="mt-4 space-y-2">
            {day.workouts.map((workout) => (
              <Link key={workout.id} href={`/workout/${workout.id}`} className="block text-sm text-primary">
                Logged: {workout.title} · {workout.exerciseCount} exercises
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </Card>
  );
}

function prettyDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, (month || 1) - 1, day || 1)));
}

function shiftIso(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function shiftMonthKey(value: string, delta: number) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
