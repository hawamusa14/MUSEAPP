export function estimateMacroTargets(
  calorieTarget: number,
  goal: "FAT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE" | "RECOMPOSITION" = "MAINTENANCE"
) {
  const proteinRatio =
    goal === "MUSCLE_GAIN" || goal === "RECOMPOSITION" ? 0.3 : 0.28;
  const fatRatio = 0.28;
  const carbRatio = 1 - proteinRatio - fatRatio;

  return {
    calories: calorieTarget,
    protein: Math.round((calorieTarget * proteinRatio) / 4),
    carbs: Math.round((calorieTarget * carbRatio) / 4),
    fat: Math.round((calorieTarget * fatRatio) / 9),
  };
}
