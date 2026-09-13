export function toDateOnly(value: Date = new Date()) {
  return new Date(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())
  );
}

export function formatLongDate(value: Date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(value);
}

export function greetingForHour(hour = new Date().getHours()) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function firstName(name: string) {
  return name.split(" ")[0] || name;
}

export function toInputDate(value: Date = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromInputDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
}

export function isPastDate(value: Date) {
  return value.getTime() < toDateOnly().getTime();
}

export function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export function parseMonthKey(value?: string) {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, 1));
  }

  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
}

export function monthKey(value: Date) {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(value: Date, delta: number) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + delta, 1));
}

export function monthLabel(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export function monthGrid(monthStart: Date) {
  const year = monthStart.getUTCFullYear();
  const month = monthStart.getUTCMonth();
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Array<Date | null> = Array.from({ length: firstWeekday }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(Date.UTC(year, month, day)));
  }

  return cells;
}


export function startOfWeek(value: Date) {
  const date = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  );
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

export function weekDays(start: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    return day;
  });
}

export function weekKey(value: Date) {
  return startOfWeek(value).toISOString().slice(0, 10);
}

export function parseWeekKey(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return startOfWeek(fromInputDate(value));
  }
  return startOfWeek(toDateOnly());
}

export function shiftWeek(value: Date, delta: number) {
  const next = new Date(value);
  next.setUTCDate(value.getUTCDate() + delta * 7);
  return startOfWeek(next);
}

export function weekLabel(start: Date) {
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

export function formatWeekday(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(value);
}

export function formatLongDateUtc(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}
