"use client";

import { useEffect } from "react";

type Theme = "LIGHT" | "DARK" | "SYSTEM";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "DARK" || (theme === "SYSTEM" && prefersDark);
  root.classList.toggle("dark", isDark);
}

export function ThemeProvider({
  theme,
  children,
}: {
  theme?: Theme | null;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const stored = window.localStorage.getItem("muse-theme") as Theme | null;
    applyTheme(theme ?? stored ?? "LIGHT");
  }, [theme]);

  return <>{children}</>;
}

export function persistTheme(theme: Theme) {
  window.localStorage.setItem("muse-theme", theme);
  applyTheme(theme);
}
