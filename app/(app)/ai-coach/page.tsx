import { askMuseCoach } from "@/lib/ai/aiService";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AiCoachPage() {
  const reply = await askMuseCoach("How should I think about training today?");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">MUSE Coach</p>
        <h1 className="mt-2 font-heading text-4xl">A quiet second mind</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Today’s note</CardTitle>
          <CardDescription>
            Guidance stays server-side and never claims medical certainty.
          </CardDescription>
        </CardHeader>
        <p className="leading-7 text-muted-foreground">{reply.text}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Provider: {reply.provider}
        </p>
      </Card>
    </div>
  );
}
