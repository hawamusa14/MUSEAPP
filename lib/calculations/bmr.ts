type Sex = "FEMALE" | "MALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export function calculateBmr(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex?: Sex | null;
}) {
  const { weightKg, heightCm, age, sex } = input;
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return null;

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const sexOffset = sex === "MALE" ? 5 : sex === "FEMALE" ? -161 : -78;
  return Math.round(base + sexOffset);
}
