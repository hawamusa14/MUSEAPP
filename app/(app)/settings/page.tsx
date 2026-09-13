import { requireUser } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <SettingsForm
      name={user.name}
      email={user.email}
      weightUnit={user.settings?.weightUnit ?? "LB"}
      heightUnit={user.settings?.heightUnit ?? "IN"}
      theme={user.settings?.theme ?? "LIGHT"}
      heightCm={user.profile?.heightCm ?? null}
      activityLevel={user.profile?.activityLevel ?? null}
      experience={user.profile?.experience ?? null}
      primaryGoalKind={user.profile?.primaryGoalKind ?? null}
      targetWeight={user.profile?.targetWeight ?? null}
      trainingFrequency={user.profile?.trainingFrequency ?? null}
      preferredDurationMin={user.profile?.preferredDurationMin ?? null}
    />
  );
}
