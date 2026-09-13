import { requireUser } from "@/lib/auth";
import { getNutritionPage } from "@/lib/data/studio";
import { formatShortDate, toInputDate } from "@/lib/dates";
import { NutritionForm } from "@/components/studio/nutrition-form";
import { MealEntryList } from "@/components/studio/meal-entry-list";
import { SavedMeals } from "@/components/studio/saved-meals";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CaloriesLeftCard } from "@/components/studio/calories-left-card";
import { getDayEnergy } from "@/lib/data/energy";

export default async function NutritionPage() {
  const user = await requireUser();
  const [data, energy] = await Promise.all([getNutritionPage(user.id), getDayEnergy(user.id)]);
  const calorieTarget = user.settings?.calorieTarget ?? 0;
  const proteinTarget = user.settings?.proteinTarget ?? 0;
  const today = toInputDate();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">Nourish</p>
        <h1 className="mt-2 font-heading text-4xl">Nutrition</h1>
        <p className="mt-2 text-muted-foreground">
          Log meals, edit what you already saved, and keep snacks you repeat.
        </p>
      </header>

      <CaloriesLeftCard
        calorieGoal={energy.calorieGoal}
        burned={energy.burned}
        eaten={energy.eaten}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Calories</p>
          <p className="mt-2 font-heading text-2xl">
            {Math.round(energy.eaten)}
            {energy.allowed ? ` / ${Math.round(energy.allowed)}` : calorieTarget ? ` / ${calorieTarget}` : ""}
          </p>
          {energy.allowed ? <Progress className="mt-3" value={(energy.eaten / energy.allowed) * 100} /> : null}
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Protein</p>
          <p className="mt-2 font-heading text-2xl">
            {Math.round(energy.proteinEaten)}g
            {energy.proteinGoal ? ` / ${energy.proteinGoal}g` : proteinTarget ? ` / ${proteinTarget}g` : ""}
          </p>
          {energy.proteinGoal ? <Progress className="mt-3" value={(energy.proteinEaten / energy.proteinGoal) * 100} /> : null}
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Carbs</p>
          <p className="mt-2 font-heading text-2xl">
            {Math.round(energy.carbsEaten)}g
            {energy.carbsGoal ? ` / ${energy.carbsGoal}g` : ""}
          </p>
          {energy.carbsGoal ? <Progress className="mt-3" value={(energy.carbsEaten / energy.carbsGoal) * 100} /> : null}
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Water</p>
          <p className="mt-2 font-heading text-2xl">{Math.round(data.daily?.waterMl ?? 0)} ml</p>
        </Card>
      </div>

      <NutritionForm today={today} waterMl={data.daily?.waterMl ?? 0} />

      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <CardDescription>{formatShortDate(data.date)}</CardDescription>
        </CardHeader>
        <MealEntryList meals={data.meals} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved meals and snacks</CardTitle>
          <CardDescription>Reuse a favorite, change the macros, or delete it.</CardDescription>
        </CardHeader>
        <SavedMeals meals={data.savedMeals} today={today} />
      </Card>

      {data.logged.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Logged meals</CardTitle>
            <CardDescription>Change or remove anything already submitted.</CardDescription>
          </CardHeader>
          <MealEntryList meals={data.logged} showDate />
        </Card>
      ) : null}

      {data.recent.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent days</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {data.recent.map((day) => (
              <div key={day.id} className="flex justify-between text-sm">
                <span>{formatShortDate(day.date)}</span>
                <span className="text-muted-foreground">
                  {Math.round(day.calories)} cal · {Math.round(day.protein)}g protein
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
