import { requireUser } from "@/lib/auth";
import { getNutritionPage } from "@/lib/data/studio";
import { formatShortDate, toInputDate } from "@/lib/dates";
import { NutritionForm } from "@/components/studio/nutrition-form";
import { MealEntryList } from "@/components/studio/meal-entry-list";
import { SavedMeals } from "@/components/studio/saved-meals";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function NutritionPage() {
  const user = await requireUser();
  const data = await getNutritionPage(user.id);
  const calories = data.daily?.calories ?? 0;
  const protein = data.daily?.protein ?? 0;
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Calories</p>
          <p className="mt-2 font-heading text-2xl">
            {Math.round(calories)}
            {calorieTarget ? ` / ${calorieTarget}` : ""}
          </p>
          {calorieTarget ? <Progress className="mt-3" value={(calories / calorieTarget) * 100} /> : null}
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Protein</p>
          <p className="mt-2 font-heading text-2xl">
            {Math.round(protein)}g
            {proteinTarget ? ` / ${proteinTarget}g` : ""}
          </p>
          {proteinTarget ? <Progress className="mt-3" value={(protein / proteinTarget) * 100} /> : null}
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
