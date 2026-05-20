import { PageHeader } from "@/components/app/page-header";
import { HistoryClient } from "@/components/history/history-client";

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="History" subtitle="Review saved symptom checks, report analysis, and chatbot conversations." />
      <HistoryClient />
    </>
  );
}
