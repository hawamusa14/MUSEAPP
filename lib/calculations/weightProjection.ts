const LBS_PER_WEEK_PER_3500 = 3500;

export function projectWeightChange(input: {
  currentWeight: number;
  dailyDeficit: number;
  weeks?: number;
}) {
  const weeks = input.weeks ?? 8;
  const weeklyChange = input.dailyDeficit / (LBS_PER_WEEK_PER_3500 / 7);
  return Number((input.currentWeight + weeklyChange * weeks).toFixed(1));
}

export function estimateGoalDate(input: {
  currentWeight: number;
  goalWeight: number;
  dailyDeficit: number;
}) {
  const remaining = input.goalWeight - input.currentWeight;
  if (input.dailyDeficit === 0) return null;
  const days = Math.abs((remaining * 3500) / input.dailyDeficit);
  if (!Number.isFinite(days)) return null;
  const date = new Date();
  date.setDate(date.getDate() + Math.round(days));
  return date;
}
