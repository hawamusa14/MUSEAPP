import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/dates";
import { withEnergyTotals, type DayEnergy } from "@/lib/nutrition";

export async function getDayEnergy(userId: string, date = toDateOnly()) {
  const [settings, daily, workouts, cardio] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.dailyNutrition.findFirst({ where: { userId, date } }),
    prisma.workout.findMany({
      where: { userId, date, status: { in: ["COMPLETED", "IN_PROGRESS"] } },
      select: { calories: true },
    }),
    prisma.cardioSession.findMany({
      where: { userId, date },
      select: { calories: true },
    }),
  ]);

  const workoutBurn = workouts.reduce((sum, item) => sum + (item.calories || 0), 0);
  const cardioBurn = cardio.reduce((sum, item) => sum + (item.calories || 0), 0);
  const energy: DayEnergy = {
    eaten: daily?.calories || 0,
    burned: workoutBurn + cardioBurn,
    calorieGoal: settings?.calorieTarget || 0,
    proteinEaten: daily?.protein || 0,
    proteinGoal: settings?.proteinTarget || 0,
    carbsEaten: daily?.carbs || 0,
    carbsGoal: settings?.carbsTarget || 0,
    fatEaten: daily?.fat || 0,
    fatGoal: settings?.fatTarget || 0,
  };
  return withEnergyTotals(energy);
}
