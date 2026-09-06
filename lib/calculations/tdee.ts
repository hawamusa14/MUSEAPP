type ActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "ACTIVE"
  | "VERY_ACTIVE";

const multipliers: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

export function calculateTdee(
  bmr: number | null,
  activityLevel: ActivityLevel = "MODERATE"
) {
  if (!bmr) return null;
  return Math.round(bmr * multipliers[activityLevel]);
}
