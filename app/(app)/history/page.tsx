import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getHistoryTimeline } from "@/lib/data/history";
import { Card } from "@/components/ui/card";
import { NotesImport } from "@/components/workout/notes-import";

export default async function HistoryPage() {
  const user = await requireUser();
  const items = await getHistoryTimeline(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">Archive</p>
        <h1 className="mt-2 font-heading text-4xl">History</h1>
        <p className="mt-2 text-muted-foreground">
          Workouts, meals, steps, photos, and notes from the same records used everywhere else.
        </p>
      </header>

      <NotesImport defaultYear={new Date().getFullYear()} />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const body = (
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {item.date} · {item.kind}
                    </p>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                  {item.href ? <span className="text-sm text-primary">View</span> : null}
                </div>
              </Card>
            );
            return item.href ? (
              <Link key={`${item.kind}-${item.id}`} href={item.href} className="block">
                {body}
              </Link>
            ) : (
              <div key={`${item.kind}-${item.id}`}>{body}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
