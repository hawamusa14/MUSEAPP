import Link from "next/link";
import { appNav } from "@/lib/navigation";
import { Card } from "@/components/ui/card";

export default function MorePage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-heading text-4xl">More</h1>
      <div className="grid gap-3">
        {appNav.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="flex items-center gap-3 py-4">
                <Icon className="size-4 text-primary" aria-hidden />
                <span>{item.label}</span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
