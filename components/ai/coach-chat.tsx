"use client";

import { useState, useTransition } from "react";
import { askCoachAction } from "@/lib/actions/ai";
import { applyProposedScheduleAction } from "@/lib/actions/plans";
import type { ProposedDay } from "@/lib/planning";
import { planKindMeta } from "@/lib/planning";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const SUGGESTIONS = [
  "What am I doing tomorrow?",
  "When should I train glutes again?",
  "Should tomorrow be a rest day?",
  "Build me a workout schedule for this week.",
  "I missed today's workout. Where should I move it?",
  "I only have 45 minutes tomorrow. Can you adjust my planned workout?",
];

type Message = {
  role: "user" | "coach";
  text: string;
  proposal?: ProposedDay[];
};

export function CoachChat() {
  const [pending, startTransition] = useTransition();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "coach",
      text: "Ask about tomorrow, recovery, or a week of training. I will use your calendar and recent sessions. Nothing is added until you approve it.",
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuestion("");
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    startTransition(async () => {
      const result = await askCoachAction({ question: trimmed });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessages((current) => [
        ...current,
        { role: "coach", text: result.data.text, proposal: result.data.proposal },
      ]);
    });
  }

  return (
    <div className="muse-page mx-auto flex min-h-[70vh] max-w-3xl flex-col gap-5 lg:min-h-[78vh]">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-primary">MUSE Coach</p>
        <h1 className="mt-2 font-heading text-4xl">A quiet second mind</h1>
        <p className="mt-2 text-muted-foreground">
          Guidance stays general and never claims medical certainty. Calendar changes wait for your approval.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((item) => (
          <button
            key={item}
            type="button"
            className="min-h-11 rounded-full border border-border px-3 text-left text-sm hover:bg-accent"
            onClick={() => ask(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <Card className="flex flex-1 flex-col">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          <CardDescription>Answers use your upcoming plan and recent training.</CardDescription>
        </CardHeader>
        <div className="flex-1 space-y-4 overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "ml-8 rounded-2xl bg-primary px-4 py-3 text-primary-foreground"
                  : "mr-8 rounded-2xl bg-accent px-4 py-3"
              }
            >
              {message.role === "coach" ? (
                <p className="muse-typing text-sm leading-7">{message.text}</p>
              ) : (
                <p className="text-sm leading-7">{message.text}</p>
              )}
              {message.proposal?.length ? (
                <div className="mt-4 space-y-2">
                  {message.proposal.map((day) => (
                    <div key={`${day.date}-${day.title}`} className="rounded-xl border border-border/70 bg-background px-3 py-2 text-sm">
                      <p className="font-medium">
                        {planKindMeta(day.kind).icon} {day.title}
                      </p>
                      <p className="text-muted-foreground">{day.date}</p>
                    </div>
                  ))}
                  <Button
                    className="mt-2 min-h-11"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await applyProposedScheduleAction({ days: message.proposal });
                        if (!result.ok) {
                          setError(result.error);
                          return;
                        }
                        setNotice(`${result.data.count} days added to your calendar.`);
                      })
                    }
                  >
                    Approve this schedule
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
          {pending ? <p className="muse-typing text-sm text-muted-foreground">MUSE is thinking…</p> : null}
        </div>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            ask(question);
          }}
        >
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What should I schedule for tomorrow?"
            className="min-h-12"
          />
          <Button type="submit" className="min-h-12" disabled={pending}>
            Ask
          </Button>
        </form>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        {notice ? <p className="mt-3 text-sm text-primary">{notice}</p> : null}
      </Card>
    </div>
  );
}
