"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TitleEditor({
  value,
  heading,
  className,
  disabled,
  onSave,
}: {
  value: string;
  heading?: boolean;
  className?: string;
  disabled?: boolean;
  onSave: (title: string) => Promise<{ ok: true; data?: unknown } | { ok: false; error: string }>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(value);
  const [saved, setSaved] = useState(value);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const Tag = heading ? "h1" : "p";

  useEffect(() => {
    setSaved(value);
    if (!editing) setTitle(value);
  }, [value, editing]);

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Tag className={cn(heading ? "mt-1 font-heading text-4xl" : "font-medium", className)}>{saved}</Tag>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-11"
          disabled={disabled}
          onClick={() => {
            setTitle(saved);
            setEditing(true);
          }}
        >
          Rename
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-label="Name"
        />
        <Button
          type="button"
          className="min-h-11"
          disabled={pending || !title.trim()}
          onClick={() =>
            startTransition(async () => {
              const next = title.trim();
              const result = await onSave(next);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setSaved(next);
              setError(null);
              setEditing(false);
            })
          }
        >
          {pending ? "Saving..." : "Save name"}
        </Button>
        <Button type="button" variant="ghost" className="min-h-11" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
