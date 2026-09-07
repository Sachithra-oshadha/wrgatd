"use client";

import { use } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";
import { StatusBadge } from "@/components/app/status-badge";
import { ReportView } from "@/components/app/report-view";
import { VersionList } from "@/components/app/version-list";
import { CorrectionBanner } from "@/components/app/correction-banner";

import { useAuth } from "@/hooks/use-auth";
import { useReport } from "@/hooks/use-reports";
import { formatWeekRange } from "@/lib/weeks";
import { fullName } from "@/lib/types";
import { isEditable } from "@/lib/constants";


export default function ReportDetailPage({
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

  const isOwner = user?.user_id === report.user.user_id;
  const canEdit = isOwner && isEditable(report.status);
  const canReview = isManager && report.status === "SUBMITTED";

  return (
    <>
      <PageHeader
        title={`${fullName(report.user)} — weekly report`}
        description={`${formatWeekRange(report.week_start, report.week_end)} · ${report.project.name}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={report.status} />

            {canEdit && (
              <Button asChild>
                <Link href={`/reports/${reportId}/edit`}>Edit</Link>
              </Button>
            )}

            {canReview && (
              <Button asChild>
                <Link href={`/reviews/${reportId}`}>Review</Link>
              </Button>
            )}
          </div>
        }
      />

      {report.status === "NEEDS_CORRECTION" && isOwner && (
        <CorrectionBanner
          reportId={reportId}
          review={report.latest_review}
        />
      )}

      <div className="space-y-6">
        <ReportView version={report.current_version} />

        {(report.notes || report.links) && (
          <Card>
            <CardHeader>
              <CardTitle>Notes and links</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              {report.notes && (
                <p className="whitespace-pre-wrap text-body">
                  {report.notes}
                </p>
              )}

              {report.links && (
                <div className="space-y-1">
                  {report.links
                    .split("\n")
                    .filter(Boolean)
                    .map((link) => (
                      <a
                        key={link}
                        href={link.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-primary hover:underline"
                      >
                        {link.trim()}
                      </a>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {report.version_count > 1 && (
          <VersionList reportId={reportId} />
        )}
      </div>
    </>
  );
}
