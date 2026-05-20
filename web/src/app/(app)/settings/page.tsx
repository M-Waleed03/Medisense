import { PageHeader } from "@/components/app/page-header";
import { SettingsClient } from "@/components/settings/settings-client";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Security, notification, and platform preferences." />
      <SettingsClient />
    </>
  );
}
