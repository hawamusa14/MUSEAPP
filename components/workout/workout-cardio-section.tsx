"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CARDIO_ACTIVITIES,
  activityUsesDistance,
  distanceUnitForWeight,
  formatDistanceInput,
} from "@/lib/cardio";
import {
  deleteWorkoutCardioAction,
  saveWorkoutCardioAction,
} from "@/lib/actions/workouts";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type WorkoutCardio = {
  id: string;
  type: string;
  durationMin: number;
  distanceKm: number | null;
  calories: number | null;
};

const OTHER_LABEL = "Other";

function knownActivity(type: string) {
  return CARDIO_ACTIVITIES.some((item) => item.label === type && item.id !== "other");
}

export function WorkoutCardioSection({
  workoutId,
  sessions,
  weightUnit,
}: {
  workoutId: string;
  sessions: WorkoutCardio[];
  weightUnit: "LB" | "KG";
}) {
  const [adding, setAdding] = useState(sessions.length === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cardio</CardTitle>
        <CardDescription>
          Add the machine or activity after strength work. Minutes, distance when it
          applies, and calories all save with this workout.
        </CardDescription>
      </CardHeader>
      <div className="space-y-5">
        {sessions.map((session) => (
          <CardioFields
            key={session.id}
            workoutId={workoutId}
            session={session}
            weightUnit={weightUnit}
          />
        ))}
        {adding ? (
          <CardioFields
            workoutId={workoutId}
            weightUnit={weightUnit}
            onSaved={() => setAdding(false)}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            className="min-h-12 w-full"
            onClick={() => setAdding(true)}
          >
            Add cardio
          </Button>
        )}
      </div>
    </Card>
  );
}

function CardioFields({
  workoutId,
  session,
  weightUnit,
  onSaved,
}: {
  workoutId: string;
  session?: WorkoutCardio;
  weightUnit: "LB" | "KG";
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const initialKnown = session ? knownActivity(session.type) : true;
  const [activity, setActivity] = useState(
    session ? (initialKnown ? session.type : OTHER_LABEL) : "Elliptical"
  );
  const [customType, setCustomType] = useState(session && !initialKnown ? session.type : "");
  const [minutes, setMinutes] = useState(session ? String(session.durationMin) : "");
  const [distance, setDistance] = useState(formatDistanceInput(session?.distanceKm, weightUnit));
  const [calories, setCalories] = useState(session?.calories == null ? "" : String(session.calories));
  const savedType = activity === OTHER_LABEL ? customType.trim() || OTHER_LABEL : activity;
  const showDistance = activityUsesDistance(savedType);
  const distanceUnit = distanceUnitForWeight(weightUnit);
  const distanceLabel = distanceUnit === "MI" ? "Distance (mi)" : "Distance (km)";

  function save() {
    startTransition(async () => {
      const result = await saveWorkoutCardioAction({
        workoutId,
        cardioId: session?.id,
        type: savedType,
        durationMin: Number(minutes),
        distance: showDistance && distance.trim() !== "" ? Number(distance) : null,
        distanceUnit,
        calories: calories.trim() === "" ? null : Number(calories),
      });
      if (!result.ok) {
        setError(result.error);
        setMessage(null);
        return;
      }
      setError(null);
      setMessage("Saved. Those calories count toward today’s allowance.");
      router.refresh();
      if (onSaved) onSaved();
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/70 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`cardio-type-${session?.id || "new"}`}>Activity</Label>
          <select
            id={`cardio-type-${session?.id || "new"}`}
            className="h-11 w-full rounded-xl border border-input bg-background px-3"
            value={activity}
            onChange={(event) => setActivity(event.target.value)}
          >
            {CARDIO_ACTIVITIES.map((item) => (
              <option key={item.id} value={item.label}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        {activity === OTHER_LABEL ? (
          <div className="space-y-2">
            <Label htmlFor={`cardio-custom-${session?.id || "new"}`}>Name</Label>
            <Input
              id={`cardio-custom-${session?.id || "new"}`}
              value={customType}
              onChange={(event) => setCustomType(event.target.value)}
              placeholder="Zumba, swim, hike..."
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={`cardio-min-${session?.id || "new"}`}>Minutes</Label>
            <Input
              id={`cardio-min-${session?.id || "new"}`}
              inputMode="numeric"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              placeholder="20"
            />
          </div>
        )}
      </div>
      {activity === OTHER_LABEL ? (
        <div className="space-y-2">
          <Label htmlFor={`cardio-min-other-${session?.id || "new"}`}>Minutes</Label>
          <Input
            id={`cardio-min-other-${session?.id || "new"}`}
            inputMode="numeric"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            placeholder="20"
          />
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {showDistance ? (
          <div className="space-y-2">
            <Label htmlFor={`cardio-dist-${session?.id || "new"}`}>{distanceLabel}</Label>
            <Input
              id={`cardio-dist-${session?.id || "new"}`}
              inputMode="decimal"
              value={distance}
              onChange={(event) => setDistance(event.target.value)}
              placeholder="optional"
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor={`cardio-cal-${session?.id || "new"}`}>Calories burned</Label>
          <Input
            id={`cardio-cal-${session?.id || "new"}`}
            inputMode="numeric"
            value={calories}
            onChange={(event) => setCalories(event.target.value)}
            placeholder="180"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" className="min-h-12 flex-1" disabled={pending} onClick={save}>
          {pending ? "Saving..." : session ? "Save cardio" : "Add cardio"}
        </Button>
        {session ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-12"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (!window.confirm("Remove this cardio from the workout?")) return;
                const result = await deleteWorkoutCardioAction({
                  workoutId,
                  cardioId: session.id,
                });
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                router.refresh();
              })
            }
          >
            Remove
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
