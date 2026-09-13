import { titleCaseName } from "@/lib/names";
import { dateKey } from "@/lib/dates";

export type ExerciseTrendPoint = { date: Date; weight: number };

export type ExerciseTrend = {
  exerciseId: string;
  name: string;
  points: ExerciseTrendPoint[];
};

const STANCE = new Set(["seated", "sitting", "standing", "kneeling"]);
const TRAILING_EQUIPMENT = new Set([
  "dumbbell",
  "dumbbells",
  "db",
  "barbell",
  "bb",
  "machine",
  "cable",
  "cables",
  "bar",
  "ez",
]);

function singularize(token: string) {
  if (token === "curls") return "curl";
  if (token === "dips") return "dip";
  if (token === "presses") return "press";
  if (token === "raises") return "raise";
  if (token === "rows") return "row";
  if (token === "extensions") return "extension";
  if (token === "flyes" || token === "flys") return "fly";
  if (token === "pulldowns") return "pulldown";
  if (token === "biceps") return "bicep";
  if (token === "triceps") return "tricep";
  return token;
}

export function exerciseProgressKey(name: string) {
  const tokens = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(singularize)
    .filter((token) => !STANCE.has(token));

  while (tokens.length > 2 && TRAILING_EQUIPMENT.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  return tokens.join(" ");
}

export function exerciseProgressName(name: string) {
  const key = exerciseProgressKey(name);
  return titleCaseName(key || name);
}

export function mergeTrendPoints(points: ExerciseTrendPoint[]) {
  const byDay = new Map<string, ExerciseTrendPoint>();
  for (const point of points) {
    const day = dateKey(point.date);
    const current = byDay.get(day);
    if (!current || point.weight > current.weight) {
      byDay.set(day, point);
    }
  }
  return [...byDay.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function groupExerciseTrends(
  rows: {
    exerciseId: string;
    name: string;
    date: Date;
    weight: number;
  }[]
): ExerciseTrend[] {
  const trends = new Map<string, ExerciseTrend>();

  for (const row of rows) {
    if (row.weight <= 0) continue;
    const key = exerciseProgressKey(row.name) || row.exerciseId;
    const current = trends.get(key);
    if (!current) {
      trends.set(key, {
        exerciseId: key,
        name: exerciseProgressName(row.name),
        points: [{ date: row.date, weight: row.weight }],
      });
      continue;
    }
    current.points.push({ date: row.date, weight: row.weight });
  }

  return [...trends.values()]
    .map((trend) => ({
      ...trend,
      points: mergeTrendPoints(trend.points),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
