export const CARDIO_ACTIVITIES = [
  { id: "elliptical", label: "Elliptical", distance: true },
  { id: "treadmill", label: "Treadmill", distance: true },
  { id: "peloton_bike", label: "Peloton bike", distance: true },
  { id: "stationary_bike", label: "Stationary bike", distance: true },
  { id: "stairmaster", label: "StairMaster", distance: false },
  { id: "outdoor_walk", label: "Outdoor walk", distance: true },
  { id: "outdoor_run", label: "Outdoor run", distance: true },
  { id: "dancing", label: "Dancing", distance: false },
  { id: "rowing", label: "Rowing machine", distance: true },
  { id: "jump_rope", label: "Jump rope", distance: false },
  { id: "hiit", label: "HIIT", distance: false },
  { id: "other", label: "Other", distance: true },
] as const;

export type CardioActivity = (typeof CARDIO_ACTIVITIES)[number];

const KM_PER_MILE = 1.60934;

export function activityUsesDistance(type: string) {
  const match = CARDIO_ACTIVITIES.find(
    (item) => item.label.toLowerCase() === type.trim().toLowerCase() || item.id === type
  );
  if (!match) return true;
  return match.distance;
}

export function distanceUnitForWeight(weightUnit: "LB" | "KG") {
  return weightUnit === "LB" ? "MI" : "KM";
}

export function formatDistanceInput(km: number | null | undefined, weightUnit: "LB" | "KG") {
  if (km == null) return "";
  const value = weightUnit === "LB" ? km / KM_PER_MILE : km;
  return String(Math.round(value * 100) / 100);
}

export function toDistanceKm(distance: number | null | undefined, unit: "MI" | "KM" | undefined) {
  if (distance == null) return null;
  if (unit === "MI") return distance * KM_PER_MILE;
  return distance;
}
