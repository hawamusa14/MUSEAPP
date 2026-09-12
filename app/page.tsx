import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMissingEnv } from "@/lib/env";
import { AuthControls } from "@/components/layout/auth-controls";
import { MissingConfig } from "@/components/setup/missing-config";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default async function Home() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (userId) redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_#f8e7e4,_#fffaf8_42%,_#f4eee9)]">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <p className="font-heading text-3xl tracking-[0.22em]">MUSE</p>
        <AuthControls />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 pb-24 pt-10 text-center sm:px-10">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">
          Fitness · Wellness · Intelligence
        </p>
        <h1 className="mt-6 font-heading text-5xl leading-tight text-foreground sm:text-7xl">
          Your Personal Fitness World. You are your own MUSE
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
          A luxury wellness journal, a sophisticated workout studio, and a
          thoughtful progress companion — designed to feel intimate, calm, and
          quietly powerful.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Show when="signed-out">
            <SignUpButton mode="redirect">
              <Button size="lg">Begin Your Journal</Button>
            </SignUpButton>
            <SignInButton mode="redirect">
              <Button variant="outline" size="lg">
                I Already Have an Account
              </Button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Button size="lg" render={<a href="/dashboard" />}>
              Open your studio
            </Button>
          </Show>
        </div>
        {getMissingEnv().length > 0 ? (
          <div className="mx-auto mt-10 max-w-xl text-left">
            <MissingConfig names={getMissingEnv()} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
