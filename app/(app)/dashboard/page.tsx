import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pr?: string }>;
}) {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const { pr } = await searchParams;

  return (
    <DashboardView
      prCount={pr ? Number(pr) : 0}
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
      calorieTarget={user.settings?.calorieTarget ?? null}
      proteinTarget={user.settings?.proteinTarget ?? null}
    />
  );
}
