"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function AuthControls() {
  return (
    <div className="flex items-center gap-3">
      <Show when="signed-out">
        <SignInButton mode="redirect">
          <Button variant="ghost">Sign in</Button>
        </SignInButton>
        <SignUpButton mode="redirect">
          <Button>Join MUSE</Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  );
}
