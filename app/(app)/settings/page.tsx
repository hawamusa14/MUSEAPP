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
    />
  );
}
