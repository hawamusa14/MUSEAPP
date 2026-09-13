import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { getDayEnergy } from "@/lib/data/energy";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pr?: string; done?: string }>;
}) {
  const user = await requireUser();
  const [data, energy] = await Promise.all([getDashboardData(user.id), getDayEnergy(user.id)]);
  const { pr, done } = await searchParams;

  return (
    <DashboardView
      prCount={pr ? Number(pr) : 0}
      justFinished={done === "1"}
      name={user.name}
      workout={data.activeWorkout ?? data.todaysWorkout}
      weight={
        data.latestWeight
          ? {
              weight: data.latestWeight.weight,
              unit: data.latestWeight.unit,
            }
          : null
      }
      steps={data.latestSteps}
      nutrition={data.latestNutrition}
      stepGoal={user.settings?.stepGoal ?? 8000}
      calorieTarget={energy.allowed || user.settings?.calorieTarget || null}
      proteinTarget={energy.proteinGoal || user.settings?.proteinTarget || null}
      carbsTarget={energy.carbsGoal || null}
      caloriesLeft={energy.left}
      caloriesBurned={energy.burned}
      caloriesEaten={energy.eaten}
      todayPlans={data.todayPlans}
      tomorrowPlans={data.tomorrowPlans}
      weekWorkouts={data.weekWorkouts}
      workoutsTarget={data.workoutsTarget}
    />
  );
}
