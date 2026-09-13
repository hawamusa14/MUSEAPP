import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

function hasCurrentModels(client: PrismaClient) {
  return Boolean(
    (client as { plannedWorkout?: unknown }).plannedWorkout &&
      (client as { workoutSchedule?: unknown }).workoutSchedule &&
      (client as { workoutTemplate?: unknown }).workoutTemplate &&
      (client as { savedMeal?: unknown }).savedMeal
  );
}

const existing = globalForPrisma.prisma;
export const prisma =
  existing && hasCurrentModels(existing) ? existing : createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
