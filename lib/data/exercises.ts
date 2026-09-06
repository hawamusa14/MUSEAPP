import { prisma } from "@/lib/prisma";

export async function searchExercises(input: {
  userId: string;
  query?: string;
  categoryId?: string;
}) {
  const query = input.query?.trim();

  return prisma.exercise.findMany({
    where: {
      AND: [
        {
          OR: [{ userId: null }, { userId: input.userId }],
        },
        input.categoryId ? { categoryId: input.categoryId } : {},
        query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { equipment: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    include: { category: true },
    orderBy: [{ isCustom: "asc" }, { name: "asc" }],
    take: 40,
  });
}

export async function getExerciseCategories() {
  return prisma.exerciseCategory.findMany({
    orderBy: { name: "asc" },
  });
}
