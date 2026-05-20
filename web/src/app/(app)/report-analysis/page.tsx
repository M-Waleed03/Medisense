import { PageHeader } from "@/components/app/page-header";
import { ReportUpload } from "@/components/reports/report-upload";

export default function ReportAnalysisPage() {
  return (
    <>
      <PageHeader title="Report analysis" subtitle="Upload medical reports for OCR extraction and dashboard-ready clinical indicators." />
      <ReportUpload />
    </>
  );
}
