import type { ExerciseTrend } from "@/lib/data/studio";

function axisDate(value: Date, withYear: boolean) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
    timeZone: "UTC",
  }).format(value);
}

function dateTickIndexes(count: number) {
  if (count <= 1) return [0];
  if (count === 2) return [0, 1];
  if (count <= 5) return [0, count - 1];
  return [0, Math.round((count - 1) / 2), count - 1];
}

function weightTicks(min: number, max: number) {
  if (min === max) return [Math.round(min)];
  const mid = (min + max) / 2;
  return [min, mid, max].map((value) => Math.round(value));
}

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
  const left = 44;
  const right = width - 16;
  const top = 20;
  const bottom = height - 28;

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
  const spanYears = first.date.getUTCFullYear() !== latest.date.getUTCFullYear();
  const xTicks = dateTickIndexes(points.length);
  const yTicks = [...new Set(weightTicks(yMin, yMax))];
  const peak = Math.max(...weights);

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
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-48 w-full min-w-[28rem]"
          role="img"
          aria-label={`${exercise.name} progress`}
        >
          {yTicks.map((tick) => (
            <g key={`y-${tick}`}>
              <line
                x1={left}
                y1={y(tick)}
                x2={right}
                y2={y(tick)}
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              <text
                x={left - 8}
                y={y(tick) + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {tick}
              </text>
            </g>
          ))}
          <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="currentColor" strokeOpacity="0.15" />
          <path d={path} fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" />
          {points.map((point, index) => {
            const showWeight = point.weight === peak || index === points.length - 1;
            return (
              <g key={`${point.date.toISOString()}-${index}`}>
                <circle cx={x(index)} cy={y(point.weight)} r="4.5" className="fill-primary" />
                {showWeight ? (
                  <text
                    x={x(index)}
                    y={y(point.weight) - 10}
                    textAnchor="middle"
                    className="fill-foreground text-[11px] tabular-nums"
                  >
                    {point.weight}
                  </text>
                ) : null}
              </g>
            );
          })}
          {xTicks.map((index) => {
            const point = points[index];
            const label = axisDate(point.date, spanYears && index === points.length - 1);
            return (
              <text
                key={`x-${index}`}
                x={x(index)}
                y={height - 8}
                textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
                className="fill-muted-foreground text-[10px]"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
