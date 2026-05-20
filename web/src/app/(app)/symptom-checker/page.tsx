import { PageHeader } from "@/components/app/page-header";
import { SymptomChecker } from "@/components/symptoms/symptom-checker";

export default function SymptomCheckerPage() {
  return (
    <>
      <PageHeader title="Symptom checker" subtitle="Select observed symptoms and receive an AI-backed probability with safety-first recommendations." />
      <SymptomChecker />
    </>
  );
}
