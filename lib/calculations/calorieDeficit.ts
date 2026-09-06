export function estimateCalorieBalance(input: {
  intake: number;
  tdee?: number | null;
  exerciseCalories?: number;
}) {
  const maintenance = (input.tdee ?? 0) + (input.exerciseCalories ?? 0);
  if (!maintenance) return null;

  return {
    maintenance,
    intake: input.intake,
    balance: Math.round(input.intake - maintenance),
  };
}
