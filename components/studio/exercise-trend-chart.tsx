import { formatShortDate } from "@/lib/dates";
import type { ExerciseTrend } from "@/lib/data/studio";

export function ExerciseTrendChart({
  exercise,
  unit,
}: {
  exercise: ExerciseTrend;
  unit: string;
}) {
  const points = exercise.points;
  const width = 640;
  const height = 200;
  const weights = points.map((point) => point.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const pad = (max - min) * 0.2 || 10;
  const yMin = Math.max(0, min - pad);
  const yMax = max + pad;
  const left = 36;
  const right = width - 12;
  const top = 16;
  const bottom = height - 36;

  function x(index: number) {
    if (points.length === 1) return (left + right) / 2;
    return left + (index / (points.length - 1)) * (right - left);
  }

  function y(weight: number) {
    return bottom - ((weight - yMin) / (yMax - yMin)) * (bottom - top);
  }

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(point.weight).toFixed(1)}`)
    .join(" ");

  const latest = points[points.length - 1];
  const first = points[0];

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="font-heading text-2xl">{exercise.name}</h3>
          <p className="text-sm text-muted-foreground">
            Heaviest set: {first.weight} {unit} in{" "}
            {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(first.date)}
            {latest.weight !== first.weight
              ? ` → ${latest.weight} ${unit} in ${new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(latest.date)}`
              : ""}
          </p>
        </div>
        <p className="font-sans text-2xl tabular-nums">{latest.weight} {unit}</p>
      </div>
      <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full min-w-[28rem]" role="img" aria-label={`${exercise.name} progress`}>
        <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="currentColor" strokeOpacity="0.15" />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" />
        {points.map((point, index) => (
          <g key={`${point.date.toISOString()}-${index}`}>
            <circle cx={x(index)} cy={y(point.weight)} r="5" className="fill-primary" />
            <text
              x={x(index)}
              y={y(point.weight) - 10}
              textAnchor="middle"
              className="fill-foreground text-[11px]"
            >
              {point.weight}
            </text>
            <text
              x={x(index)}
              y={height - 12}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {formatShortDate(point.date)}
            </text>
          </g>
        ))}
      </svg>
      </div>
    </div>
  );
}
