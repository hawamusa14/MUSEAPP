"use client";

import { useState, useTransition } from "react";
import { addNutritionEntryAction } from "@/lib/actions/nutrition";
import { addCardioAction, addProgressCheckInAction } from "@/lib/actions/progress";
import { quickCreatePlanAction } from "@/lib/actions/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CARDIO_ACTIVITIES } from "@/lib/cardio";

type SheetKind = "nutrition" | "cardio" | "photo";

export function DayLogSheet({
  kind,
  date,
  onClose,
  onSaved,
}: {
  kind: SheetKind;
  date: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const title =
    kind === "nutrition" ? "Log food" : kind === "cardio" ? "Add cardio" : "Progress check-in";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-foreground/25 p-0 sm:place-items-center sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="muse-modal flex w-full max-w-lg flex-col rounded-t-3xl bg-background p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-heading text-3xl">{title}</h2>
          <Button variant="ghost" className="min-h-11" onClick={onClose}>
            Close
          </Button>
        </div>
        {kind === "nutrition" ? (
          <NutritionFields date={date} onClose={onClose} onSaved={onSaved} />
        ) : null}
        {kind === "cardio" ? (
          <CardioFields date={date} onClose={onClose} onSaved={onSaved} />
        ) : null}
        {kind === "photo" ? (
          <PhotoFields date={date} onClose={onClose} onSaved={onSaved} />
        ) : null}
      </div>
    </div>
  );
}

function NutritionFields({
  date,
  onClose,
  onSaved,
}: {
  date: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await addNutritionEntryAction({
            date,
            mealType: String(form.get("mealType") || "LUNCH"),
            foodName: String(form.get("foodName") || ""),
            calories: Number(form.get("calories")),
            protein: Number(form.get("protein") || 0),
            carbs: Number(form.get("carbs") || 0),
            fat: Number(form.get("fat") || 0),
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          onSaved("Meal saved to this day");
          onClose();
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hub-meal">Meal</Label>
          <select
            id="hub-meal"
            name="mealType"
            defaultValue="LUNCH"
            className="h-11 w-full rounded-xl border border-input bg-background px-3"
          >
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="DINNER">Dinner</option>
            <option value="SNACK">Snack</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hub-food">Food</Label>
          <Input id="hub-food" name="foodName" placeholder="Greek yogurt, salmon..." required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="hub-cal">Calories</Label>
          <Input id="hub-cal" name="calories" inputMode="numeric" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hub-pro">Protein</Label>
          <Input id="hub-pro" name="protein" inputMode="decimal" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hub-carb">Carbs</Label>
          <Input id="hub-carb" name="carbs" inputMode="decimal" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hub-fat">Fat</Label>
          <Input id="hub-fat" name="fat" inputMode="decimal" />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="min-h-12 w-full" disabled={pending} type="submit">
        {pending ? "Saving..." : "Save meal"}
      </Button>
    </form>
  );
}

function CardioFields({
  date,
  onClose,
  onSaved,
}: {
  date: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"log" | "plan">("log");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const type = String(form.get("type") || "Walk");
        const durationMin = Number(form.get("durationMin"));
        const calories = form.get("calories") ? Number(form.get("calories")) : undefined;
        startTransition(async () => {
          if (mode === "plan") {
            const result = await quickCreatePlanAction({
              date,
              kind: "CARDIO",
              title: type,
              cardioMinutes: durationMin || 30,
            });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            onSaved("Cardio planned");
            onClose();
            return;
          }
          const result = await addCardioAction({
            date,
            type,
            durationMin,
            calories,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          onSaved("Cardio logged");
          onClose();
        });
      }}
    >
      <div className="flex gap-2">
        <Button type="button" variant={mode === "log" ? "default" : "outline"} onClick={() => setMode("log")}>
          Log what I did
        </Button>
        <Button type="button" variant={mode === "plan" ? "default" : "outline"} onClick={() => setMode("plan")}>
          Plan it
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hub-cardio-type">Activity</Label>
          <select
            id="hub-cardio-type"
            name="type"
            defaultValue="Outdoor walk"
            className="h-11 w-full rounded-xl border border-input bg-background px-3"
          >
            {CARDIO_ACTIVITIES.map((item) => (
              <option key={item.id} value={item.label}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hub-cardio-min">Minutes</Label>
          <Input id="hub-cardio-min" name="durationMin" inputMode="numeric" defaultValue="30" required />
        </div>
      </div>
      {mode === "log" ? (
        <div className="space-y-2">
          <Label htmlFor="hub-cardio-cal">Calories (optional)</Label>
          <Input id="hub-cardio-cal" name="calories" inputMode="numeric" />
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="min-h-12 w-full" disabled={pending} type="submit">
        {pending ? "Saving..." : mode === "plan" ? "Add to calendar" : "Save cardio"}
      </Button>
    </form>
  );
}

function PhotoFields({
  date,
  onClose,
  onSaved,
}: {
  date: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await addProgressCheckInAction({
            date,
            angle: String(form.get("angle") || "FRONT"),
            label: String(form.get("label") || "") || undefined,
            notes: String(form.get("notes") || "") || undefined,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          await quickCreatePlanAction({ date, kind: "CHECK_IN", title: "Progress check-in" });
          onSaved("Check-in saved");
          onClose();
        });
      }}
    >
      <p className="text-sm text-muted-foreground">
        Marks this day with a photo check-in. You can add notes now; image storage can connect later.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hub-angle">Angle</Label>
          <select
            id="hub-angle"
            name="angle"
            defaultValue="FRONT"
            className="h-11 w-full rounded-xl border border-input bg-background px-3"
          >
            <option value="FRONT">Front</option>
            <option value="SIDE">Side</option>
            <option value="BACK">Back</option>
            <option value="CUSTOM">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hub-label">Label</Label>
          <Input id="hub-label" name="label" placeholder="Week 4, morning..." />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="hub-photo-notes">Notes</Label>
        <textarea
          id="hub-photo-notes"
          name="notes"
          className="min-h-24 w-full rounded-2xl border border-input bg-background px-3 py-2"
          placeholder="Lighting, cycle week, how you feel..."
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="min-h-12 w-full" disabled={pending} type="submit">
        {pending ? "Saving..." : "Save check-in"}
      </Button>
    </form>
  );
}
