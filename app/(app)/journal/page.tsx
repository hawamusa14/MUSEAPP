import { requireUser } from "@/lib/auth";
import { getJournalPage } from "@/lib/data/studio";
import { formatShortDate, toInputDate } from "@/lib/dates";
import { JournalForm } from "@/components/studio/journal-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function JournalPage() {
  const user = await requireUser();
  const entries = await getJournalPage(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">Wellness</p>
        <h1 className="mt-2 font-heading text-4xl">Journal</h1>
        <p className="mt-2 text-muted-foreground">
          A private page for energy, recovery, and the feeling of the week.
        </p>
      </header>

      <JournalForm today={toInputDate()} />

      <section className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        ) : (
          entries.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{formatShortDate(item.date)}</CardTitle>
                <CardDescription>
                  {[
                    item.energy != null ? `Energy ${item.energy}` : null,
                    item.sleep != null ? `Sleep ${item.sleep}` : null,
                    item.recovery != null ? `Recovery ${item.recovery}` : null,
                    item.stress != null ? `Stress ${item.stress}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No scores"}
                </CardDescription>
              </CardHeader>
              <p className="whitespace-pre-wrap text-sm leading-7">{item.entry}</p>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
