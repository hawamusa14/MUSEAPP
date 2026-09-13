import {
  BookOpen,
  CalendarDays,
  ChartLine,
  Dumbbell,
  History,
  LayoutDashboard,
  Settings,
  Sparkles,
  Target,
  Utensils,
  Images,
} from "lucide-react";

export const appNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/nutrition", label: "Nutrition", icon: Utensils },
  { href: "/progress", label: "Progress", icon: Images },
  { href: "/analytics", label: "Analytics", icon: ChartLine },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/ai-coach", label: "AI Coach", icon: Sparkles },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const mobileNav = [
  appNav[0],
  appNav[1],
  appNav[2],
  appNav[3],
] as const;

export const moreNav = appNav.filter(
  (item) => !["/dashboard", "/workout", "/calendar", "/nutrition"].includes(item.href)
);
