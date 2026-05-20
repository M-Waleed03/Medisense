import { PageHeader } from "@/components/app/page-header";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Live symptom predictions, report insights, and AI guidance in one clinical-grade workspace." />
      <DashboardClient />
    </>
  );
}
