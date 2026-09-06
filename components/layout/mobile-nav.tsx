"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { mobileNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 py-2 backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-5 gap-1">
        {mobileNav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px]",
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href="/more"
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px]",
              pathname === "/more"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="size-4" aria-hidden />
            More
          </Link>
        </li>
      </ul>
    </nav>
  );
}
