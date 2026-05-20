import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <>
      <PageHeader title="Admin" subtitle="Operational overview for future clinic, lab, and telemedicine workflows." />
      <Card>
        <h2 className="text-xl font-bold">Platform controls</h2>
        <p className="mt-2 text-slate-600">Admin role enforcement is represented in the data model and ready to extend with organization-level controls.</p>
      </Card>
    </>
  );
}
