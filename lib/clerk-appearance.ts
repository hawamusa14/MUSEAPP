import { shadcn } from "@clerk/ui/themes";

export const clerkAppearance = {
  theme: shadcn,
  variables: {
    colorPrimary: "#b76e79",
    colorBackground: "#fffaf8",
    colorText: "#3d2a2c",
    borderRadius: "0.85rem",
    fontFamily: "var(--font-geist-sans)",
  },
  elements: {
    card: "shadow-none border border-[#ead9d6]",
    headerTitle: "font-serif",
  },
};
