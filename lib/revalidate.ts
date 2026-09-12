import { revalidatePath } from "next/cache";

export function revalidateStudio(workoutId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/workout");
  revalidatePath("/calendar");
  revalidatePath("/nutrition");
  revalidatePath("/progress");
  revalidatePath("/analytics");
  revalidatePath("/goals");
  revalidatePath("/journal");
  revalidatePath("/history");
  if (workoutId) {
    revalidatePath(`/workout/${workoutId}`);
  }
}