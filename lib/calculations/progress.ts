export function completionRatio(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(1, Math.max(0, current / target));
}

export function remainingValue(current: number, target: number) {
  return Number((target - current).toFixed(1));
}
