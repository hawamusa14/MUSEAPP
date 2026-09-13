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
