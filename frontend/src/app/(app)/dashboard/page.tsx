"use client";

import Link from "next/link";
import { Plus, FileText, CircleCheck, TriangleAlert, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { StatusBadge } from "@/components/app/status-badge";
import { CorrectionBanner } from "@/components/app/correction-banner";
import { TasksTrendChart } from "@/components/charts/tasks-trend-chart";
import { TeamDashboard } from "@/components/app/team-dashboard";

import { useAuth } from "@/hooks/use-auth";
import { usePersonalDashboard } from "@/hooks/use-dashboard";
import { formatWeekRange } from "@/lib/weeks";
import { isEditable } from "@/lib/constants";


export default function DashboardPage() {
  const { user, isManager } = useAuth();
  const { data, isPending } = usePersonalDashboard();

  if (isPending || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const report = data.current_week_report;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.first_name ?? ""}`}
        description={`Week of ${formatWeekRange(data.week_start, data.week_end)}`}
        action={
          !report && (
            <Button asChild>
              <Link href="/reports/new">
                <Plus className="mr-2 h-4 w-4" />
                Create this week's report
              </Link>
            </Button>
          )
        }
      />

      {data.needs_correction_reports.map((item) => (
        <CorrectionBanner
          key={item.report_id}
          reportId={item.report_id}
          review={null}
        />
      ))}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">This week</CardTitle>
        </CardHeader>

        <CardContent>
          {report ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium text-body">
                  {report.project.name}
                </p>
                <p className="text-sm text-subtle">
                  {formatWeekRange(report.week_start, report.week_end)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={report.status} />

                <Button asChild variant="outline" size="sm">
                  <Link
                    href={
                      isEditable(report.status)
                        ? `/reports/${report.report_id}/edit`
                        : `/reports/${report.report_id}`
                    }
                  >
                    {isEditable(report.status) ? "Continue" : "View"}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-subtle">
                You have not started this week's report.
              </p>

              <Button asChild size="sm">
                <Link href="/reports/new">Start now</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Reports filed" value={data.total_reports} icon={FileText}/>

        <MetricCard
          label="Approved"
          value={data.approved_count}
          tone="approved"
          icon={CircleCheck}
        />

        <MetricCard
          label="Needs correction"
          value={data.needs_correction_count}
          tone={data.needs_correction_count > 0 ? "correction" : "default"}
          icon={TriangleAlert}
        />

        <MetricCard
          label="Approval rate"
          value={`${data.approval_rate}%`}
          hint="Approved as a share of all your reports"
          icon={TrendingUp}
        />
      </div>

      <TasksTrendChart userId={user?.user_id} />

      {isManager && <TeamDashboard compact />}
    </>
  );
}
