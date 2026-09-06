import { z } from "zod";

export const updateSettingsSchema = z.object({
  weightUnit: z.enum(["LB", "KG"]),
  heightUnit: z.enum(["IN", "CM"]),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]),
});
