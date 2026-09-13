import { revalidatePath } from "next/cache";

export function revalidateStudio(...paths: string[]) {
  const unique = new Set(paths.length > 0 ? paths : ["/dashboard"]);
  for (const path of unique) {
    revalidatePath(path);
  }
}
