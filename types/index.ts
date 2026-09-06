import type { Prisma } from "@prisma/client";
import { workoutDetailInclude } from "@/lib/data/workouts";

export type WorkoutDetail = Prisma.WorkoutGetPayload<{
  include: typeof workoutDetailInclude;
}>;

export type LastPerformance = {
  date: Date;
  summary: string;
  hint: string | null;
};
