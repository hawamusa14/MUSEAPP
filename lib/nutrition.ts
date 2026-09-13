export const MEAL_TYPE_LABELS = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
} as const;

export type MealTypeValue = keyof typeof MEAL_TYPE_LABELS;

export function mealTypeLabel(value: string) {
  return MEAL_TYPE_LABELS[value as MealTypeValue] || value;
}

export type MealEntryDTO = {
  id: string;
  date: string;
  mealType: MealTypeValue;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type SavedMealDTO = {
  id: string;
  name: string;
  mealType: MealTypeValue;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DayEnergy = {
  eaten: number;
  burned: number;
  calorieGoal: number;
  proteinEaten: number;
  proteinGoal: number;
  carbsEaten: number;
  carbsGoal: number;
  fatEaten: number;
  fatGoal: number;
};

export function calorieAllowance(goal: number, burned: number) {
  return Math.max(0, goal) + Math.max(0, burned);
}

export function caloriesRemaining(goal: number, burned: number, eaten: number) {
  return calorieAllowance(goal, burned) - eaten;
}

export function withEnergyTotals(energy: DayEnergy) {
  const allowed = calorieAllowance(energy.calorieGoal, energy.burned);
  const left = caloriesRemaining(energy.calorieGoal, energy.burned, energy.eaten);
  return { ...energy, allowed, left };
}

