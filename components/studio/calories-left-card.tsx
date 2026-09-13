import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { calorieAllowance } from "@/lib/nutrition";

export function CaloriesLeftCard({
  calorieGoal,
  burned,
  eaten,
}: {
  calorieGoal: number;
  burned: number;
  eaten: number;
}) {
  const allowed = calorieAllowance(calorieGoal, burned);
  const left = allowed - eaten;
  const over = left < 0;
  const used = allowed > 0 ? Math.min(100, (eaten / allowed) * 100) : 0;

  return (
    <Card className="border-primary/25 bg-accent/40">
      <p className="text-xs uppercase tracking-[0.16em] text-primary">Calories left</p>
      <p className="mt-2 font-heading text-4xl tabular-nums">
        {over ? `${Math.round(Math.abs(left))} over` : Math.round(left)}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {calorieGoal ? `${calorieGoal} goal` : "No calorie goal yet"}
        {burned ? ` · +${Math.round(burned)} burned` : ""}
        {calorieGoal || burned ? ` · ${Math.round(allowed)} allowed` : ""}
        {` · ${Math.round(eaten)} eaten`}
      </p>
      {allowed > 0 ? <Progress className="mt-3" value={used} label="Calories used" /> : null}
    </Card>
  );
}
