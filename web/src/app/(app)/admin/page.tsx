import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { SignalBadge } from "@/components/ui/premium";

export default function AdminPage() {
  return (
    <>
      <PageHeader title="Admin" subtitle="Operational overview for future clinic, lab, and telemedicine workflows." />
      <Card>
        <SignalBadge>Operations</SignalBadge>
        <h2 className="mt-4 text-2xl font-black text-ink">Platform controls</h2>
        <p className="mt-2 text-muted">Admin role enforcement is represented in the data model and ready to extend with organization-level controls.</p>
      </Card>
    </>
  );
}
