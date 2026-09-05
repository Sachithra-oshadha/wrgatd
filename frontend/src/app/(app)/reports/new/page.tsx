import { PageHeader } from "@/components/app/page-header";
import { ReportForm } from "@/components/app/report-form";

export default function NewReportPage() {
  return (
    <>
      <PageHeader
        title="New weekly report"
        description="Save as a draft and come back to it any time before submitting."
      />

      <ReportForm />
    </>
  );
}
