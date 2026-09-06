import { UserButton } from "@clerk/nextjs";
import { requireUser } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <ThemeProvider theme={user.settings?.theme}>
      <div className="flex min-h-full bg-background">
        <AppSidebar name={user.name} email={user.email} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border px-5 py-4 lg:hidden">
            <p className="font-heading text-2xl tracking-[0.2em]">MUSE</p>
            <UserButton />
          </header>
          <main className="flex-1 px-5 pb-24 pt-6 sm:px-8 lg:pb-10">{children}</main>
        </div>
        <MobileNav />
      </div>
    </ThemeProvider>
  );
}
