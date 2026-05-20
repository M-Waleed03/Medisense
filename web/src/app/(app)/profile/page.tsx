import { PageHeader } from "@/components/app/page-header";
import { ProfileClient } from "@/components/profile/profile-client";

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profile" subtitle="Manage the identity connected to your MEDISENSE health workspace." />
      <ProfileClient />
    </>
  );
}
