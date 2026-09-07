"use client";

import { use } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";
import { StatusBadge } from "@/components/app/status-badge";
import { ReportView } from "@/components/app/report-view";
import { VersionList } from "@/components/app/version-list";
import { ReviewPanel } from "@/components/app/review-panel";

import { useAuth } from "@/hooks/use-auth";
import { useReport } from "@/hooks/use-reports";
import { formatWeekRange } from "@/lib/weeks";
import { fullName } from "@/lib/types";


export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const reportId = Number(id);

  const { user, isManager } = useAuth();
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

  const isOwnReport = user?.user_id === report.user.user_id;
  const canReview =
    isManager && !isOwnReport && report.status === "SUBMITTED";

  return (
    <>
      <PageHeader
        title={`${fullName(report.user)} — weekly report`}
        description={`${formatWeekRange(report.week_start, report.week_end)} · ${report.project.name}`}
        action={<StatusBadge status={report.status} />}
      />

      <div className="space-y-6">
        <ReportView version={report.current_version} />

        <VersionList reportId={reportId} />

        {canReview ? (
          <ReviewPanel reportId={reportId} />
        ) : (
          <p className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-subtle">
            {isOwnReport
              ? "You cannot review your own report."
              : `This report is ${report.status.toLowerCase().replace("_", " ")} and is not awaiting review.`}
          </p>
        )}
      </div>
    </>
  );
}
