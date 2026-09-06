export function estimatedOneRepMax(weight: number, reps: number) {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Number((weight * (1 + reps / 30)).toFixed(1));
}

export function setVolume(weight?: number | null, reps?: number | null) {
  if (!weight || !reps) return 0;
  return weight * reps;
}

export function suggestNextWeight(weight: number, unit: "LB" | "KG" = "LB") {
  const increment = unit === "KG" ? 1.25 : 2.5;
  return Number((weight + increment).toFixed(2));
}

export function formatLoad(weight?: number | null, reps?: number | null, unit = "lb") {
  if (weight == null && reps == null) return "—";
  if (weight == null) return `${reps} reps`;
  if (reps == null) return `${weight} ${unit}`;
  return `${weight} ${unit} × ${reps}`;
}

export function progressionHint(
  lastWeight?: number | null,
  lastReps?: number | null,
  unit: "LB" | "KG" = "LB"
) {
  if (!lastWeight || !lastReps) return null;
  const next = suggestNextWeight(lastWeight, unit);
  const label = unit === "KG" ? "kg" : "lb";
  return `Try ${next} ${label} if you feel ready.`;
}
