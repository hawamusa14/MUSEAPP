"use client";

import { useState, useTransition } from "react";
import { SignOutButton } from "@clerk/nextjs";
import type {
  ActivityLevel,
  FitnessExperience,
  FitnessGoalKind,
  HeightUnit,
  ThemePreference,
  WeightUnit,
} from "@prisma/client";
import { updateSettingsAction } from "@/lib/actions/settings";
import { persistTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsForm({
  name,
  email,
  weightUnit,
  heightUnit,
  theme,
  heightCm,
  activityLevel,
  experience,
  primaryGoalKind,
  targetWeight,
  trainingFrequency,
  preferredDurationMin,
}: {
  name: string;
  email: string;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  theme: ThemePreference;
  heightCm: number | null;
  activityLevel: ActivityLevel | null;
  experience: FitnessExperience | null;
  primaryGoalKind: FitnessGoalKind | null;
  targetWeight: number | null;
  trainingFrequency: number | null;
  preferredDurationMin: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function save(formData: FormData) {
    const nextTheme = formData.get("theme") as ThemePreference;
    persistTheme(nextTheme);
    startTransition(async () => {
      const result = await updateSettingsAction({
        weightUnit: formData.get("weightUnit"),
        heightUnit: formData.get("heightUnit"),
        theme: nextTheme,
        heightCm: formData.get("heightCm") || null,
        activityLevel: formData.get("activityLevel") || null,
        experience: formData.get("experience") || null,
        primaryGoalKind: formData.get("primaryGoalKind") || null,
        targetWeight: formData.get("targetWeight") || null,
        trainingFrequency: formData.get("trainingFrequency") || null,
        preferredDurationMin: formData.get("preferredDurationMin") || null,
      });
      if (!result.ok) {
        setError(result.error);
        setMessage(null);
        return;
      }
      setError(null);
      setMessage("Settings saved.");
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-heading text-4xl">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Account, units, and the atmosphere of your studio.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Identity is managed by Clerk. MUSE stores your fitness world.</CardDescription>
        </CardHeader>
        <p className="text-sm">{name}</p>
        <p className="text-sm text-muted-foreground">{email}</p>
      </Card>

      <Card>
        <form action={save} className="space-y-5">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <div className="grid gap-4 sm:grid-cols-3">
            <fieldset className="space-y-2">
              <Label htmlFor="weightUnit">Weight</Label>
              <select
                id="weightUnit"
                name="weightUnit"
                defaultValue={weightUnit}
                className="h-11 w-full rounded-xl border border-input bg-background px-3"
              >
                <option value="LB">lb</option>
                <option value="KG">kg</option>
              </select>
            </fieldset>
            <fieldset className="space-y-2">
              <Label htmlFor="heightUnit">Height</Label>
              <select
                id="heightUnit"
                name="heightUnit"
                defaultValue={heightUnit}
                className="h-11 w-full rounded-xl border border-input bg-background px-3"
              >
                <option value="IN">in</option>
                <option value="CM">cm</option>
              </select>
            </fieldset>
            <fieldset className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                name="theme"
                defaultValue={theme}
                className="h-11 w-full rounded-xl border border-input bg-background px-3"
              >
                <option value="LIGHT">Soft light</option>
                <option value="DARK">Charcoal</option>
                <option value="SYSTEM">System</option>
              </select>
            </fieldset>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="heightCm">Height (cm)</Label>
              <input
                id="heightCm"
                name="heightCm"
                type="number"
                defaultValue={heightCm ?? ""}
                className="h-11 w-full rounded-xl border border-input bg-background px-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetWeight">Target weight</Label>
              <input
                id="targetWeight"
                name="targetWeight"
                type="number"
                defaultValue={targetWeight ?? ""}
                className="h-11 w-full rounded-xl border border-input bg-background px-3"
              />
            </div>
            <fieldset className="space-y-2">
              <Label htmlFor="activityLevel">Activity</Label>
              <select
                id="activityLevel"
                name="activityLevel"
                defaultValue={activityLevel ?? ""}
                className="h-11 w-full rounded-xl border border-input bg-background px-3"
              >
                <option value="">Not set</option>
                <option value="SEDENTARY">Sedentary</option>
                <option value="LIGHT">Light</option>
                <option value="MODERATE">Moderate</option>
                <option value="ACTIVE">Active</option>
                <option value="VERY_ACTIVE">Very active</option>
              </select>
            </fieldset>
            <fieldset className="space-y-2">
              <Label htmlFor="experience">Experience</Label>
              <select
                id="experience"
                name="experience"
                defaultValue={experience ?? ""}
                className="h-11 w-full rounded-xl border border-input bg-background px-3"
              >
                <option value="">Not set</option>
                <option value="NEW">New</option>
                <option value="RETURNING">Returning</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </fieldset>
            <fieldset className="space-y-2">
              <Label htmlFor="primaryGoalKind">Primary goal</Label>
              <select
                id="primaryGoalKind"
                name="primaryGoalKind"
                defaultValue={primaryGoalKind ?? ""}
                className="h-11 w-full rounded-xl border border-input bg-background px-3"
              >
                <option value="">Not set</option>
                <option value="FAT_LOSS">Fat loss</option>
                <option value="WEIGHT_LOSS">Weight loss</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="MUSCLE_GAIN">Muscle gain</option>
                <option value="RECOMPOSITION">Recomposition</option>
                <option value="STRENGTH">Strength</option>
                <option value="ENDURANCE">Endurance</option>
              </select>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="trainingFrequency">Training days / week</Label>
              <input
                id="trainingFrequency"
                name="trainingFrequency"
                type="number"
                defaultValue={trainingFrequency ?? ""}
                className="h-11 w-full rounded-xl border border-input bg-background px-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredDurationMin">Preferred session (min)</Label>
              <input
                id="preferredDurationMin"
                name="preferredDurationMin"
                type="number"
                defaultValue={preferredDurationMin ?? ""}
                className="h-11 w-full rounded-xl border border-input bg-background px-3"
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-primary">{message}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save preferences"}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <SignOutButton>
          <Button variant="outline">Sign out</Button>
        </SignOutButton>
      </Card>
    </div>
  );
}
