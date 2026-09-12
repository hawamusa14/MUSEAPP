import { requireUser } from "@/lib/auth";
import { getGoalsPage } from "@/lib/data/studio";
import { formatShortDate } from "@/lib/dates";
import { CompleteGoalButton } from "@/components/studio/complete-goal-button";
import { GoalForm } from "@/components/studio/goal-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function GoalsPage() {
  const user = await requireUser();
  const goals = await getGoalsPage(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">Aim</p>
        <h1 className="mt-2 font-heading text-4xl">Goals</h1>
        <p className="mt-2 text-muted-foreground">
          Set a target. MUSE will fill in progress from what you already log.
        </p>
      </header>

      <GoalForm />

      <section className="space-y-3">
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No goals yet. Add one above.</p>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{goal.title}</CardTitle>
                  <CardDescription>
                    {goal.type.replaceAll("_", " ").toLowerCase()}
                    {goal.targetDate ? ` · by ${formatShortDate(goal.targetDate)}` : ""}
                  </CardDescription>
                </div>
                <CompleteGoalButton goalId={goal.id} completed={Boolean(goal.completedAt)} />
              </CardHeader>
              {goal.targetValue != null ? (
                <>
                  <Progress value={goal.ratio * 100} label={goal.title} />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {goal.current ?? "—"} / {goal.targetValue}
                    {goal.unit ? ` ${goal.unit}` : ""}
                    {goal.completedAt ? " · completed" : ""}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {goal.completedAt ? "Completed." : "No numeric target — mark it when it feels done."}
                </p>
              )}
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
