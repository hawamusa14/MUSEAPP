"use client";

import { SignOutButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserMenu({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-accent/70 p-3">
      <UserButton />
      <div
        aria-hidden
        className="sr-only"
      >
        {initials || "M"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Settings"
        render={<Link href="/settings" />}
      >
        <Settings />
      </Button>
      <SignOutButton>
        <Button variant="outline" size="sm">
          Sign out
        </Button>
      </SignOutButton>
    </div>
  );
}
