"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDuration } from "@/lib/dates";

const PRESETS = [30, 45, 60, 90, 120, 180];

export function RestTimer() {
  const [duration, setDuration] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [custom, setCustom] = useState("45");

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Rest complete", { body: "Ready for the next set." });
          }
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const label = useMemo(() => formatDuration(remaining), [remaining]);

  function choose(seconds: number) {
    setDuration(seconds);
    setRemaining(seconds);
    setRunning(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rest timer</CardTitle>
        <CardDescription>Optional. Start it after a completed set.</CardDescription>
      </CardHeader>
      <p className="font-heading text-4xl tabular-nums" aria-live="polite">
        {label}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((seconds) => (
          <Button
            key={seconds}
            type="button"
            size="sm"
            variant={duration === seconds ? "default" : "outline"}
            onClick={() => choose(seconds)}
          >
            {seconds >= 120 ? `${seconds / 60} min` : `${seconds} sec`}
          </Button>
        ))}
      </div>
      <div className="mt-4 flex items-end gap-2">
        <div className="space-y-2">
          <Label htmlFor="custom-rest">Custom seconds</Label>
          <Input
            id="custom-rest"
            inputMode="numeric"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            className="w-28"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => choose(Number(custom) || 45)}
        >
          Use
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => setRunning(true)} disabled={running || remaining === 0}>
          Start
        </Button>
        <Button type="button" variant="outline" onClick={() => setRunning(false)}>
          Pause
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setRunning(false);
            setRemaining(duration);
          }}
        >
          Reset
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (typeof Notification !== "undefined" && Notification.permission === "default") {
              void Notification.requestPermission();
            }
          }}
        >
          Enable alert
        </Button>
      </div>
    </Card>
  );
}
