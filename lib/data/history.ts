import { prisma } from "@/lib/prisma";
import { dateKey } from "@/lib/dates";

export type HistoryItem = {
  id: string;
  date: string;
  kind: "workout" | "cardio" | "steps" | "nutrition" | "weight" | "photo" | "journal";
  title: string;
  href: string | null;
  detail: string;
};

export async function getHistoryTimeline(userId: string, take = 40): Promise<HistoryItem[]> {
  const [workouts, cardio, steps, nutrition, weights, photos, journal] = await Promise.all([
    prisma.workout.findMany({
      where: { userId, status: { in: ["COMPLETED", "IN_PROGRESS"] } },
      orderBy: { date: "desc" },
      take,
      include: { exercises: true },
    }),
    prisma.cardioSession.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take,
    }),
    prisma.stepEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take,
    }),
    prisma.dailyNutrition.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take,
    }),
    prisma.weightEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take,
    }),
    prisma.progressPhoto.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take,
    }),
    prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take,
    }),
  ]);

  const items: HistoryItem[] = [
    ...workouts.map((item) => ({
      id: item.id,
      date: dateKey(item.date),
      kind: "workout" as const,
      title: item.title,
      href: `/workout/${item.id}`,
      detail: `${item.status.toLowerCase()} · ${item.exercises.length} exercises`,
    })),
    ...cardio.map((item) => ({
      id: item.id,
      date: dateKey(item.date),
      kind: "cardio" as const,
      href: "/progress",
      title: item.type,
      detail: `${item.durationMin} min`,
    })),
    ...steps.map((item) => ({
      id: item.id,
      date: dateKey(item.date),
      kind: "steps" as const,
      href: "/progress",
      title: "Steps",
      detail: item.steps.toLocaleString(),
    })),
    ...nutrition.map((item) => ({
      id: item.id,
      date: dateKey(item.date),
      kind: "nutrition" as const,
      href: "/nutrition",
      title: "Nutrition",
      detail: `${Math.round(item.calories)} cal · ${Math.round(item.protein)}g protein`,
    })),
    ...weights.map((item) => ({
      id: item.id,
      date: dateKey(item.date),
      kind: "weight" as const,
      href: "/progress",
      title: "Weight",
      detail: `${item.weight} ${item.unit.toLowerCase()}`,
    })),
    ...photos.map((item) => ({
      id: item.id,
      date: dateKey(item.date),
      kind: "photo" as const,
      href: "/progress",
      title: item.label || "Progress photo",
      detail: item.angle.toLowerCase(),
    })),
    ...journal.map((item) => ({
      id: item.id,
      date: dateKey(item.date),
      kind: "journal" as const,
      href: item.workoutId ? `/workout/${item.workoutId}` : "/journal",
      title: "Journal",
      detail: item.entry.slice(0, 90),
    })),
  ];

  return items
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, take);
}
