"use client";

import { use } from "react";

import { PageHeader } from "@/components/app/page-header";
import { ReportForm } from "@/components/app/report-form";
import { ErrorState } from "@/components/app/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/app/status-badge";

import { useReport } from "@/hooks/use-reports";
import { formatWeekRange } from "@/lib/weeks";
import { isEditable } from "@/lib/constants";
import { CorrectionBanner } from "@/components/app/correction-banner";


export default function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const reportId = Number(id);

  const { data: report, isPending, isError, error, refetch } =
    useReport(reportId);

  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const editable = isEditable(report.status);

  return (
    <>
      <PageHeader
        title="Edit weekly report"
        description={`${formatWeekRange(report.week_start, report.week_end)} — ${report.project.name}`}
        action={<StatusBadge status={report.status} />}
      />
      
      {report.status === "NEEDS_CORRECTION" && (
        <CorrectionBanner
          reportId={report.report_id}
          review={report.latest_review ?? null}
          showEditButton={false}
        />
      )}

      {editable ? (
        <ReportForm report={report} />
      ) : (
        <ErrorState
          error={
            new Error(
              `This report is ${report.status.toLowerCase().replace("_", " ")} and can no longer be edited.`
            )
          }
        />
      )}
    </>
  );
}
