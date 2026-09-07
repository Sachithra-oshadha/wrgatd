"use client";

import { use } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";
import { MetricCard } from "@/components/app/metric-card";
import { StatusBadge } from "@/components/app/status-badge";
import { UserAvatar } from "@/components/app/user-avatar";
import { TasksTrendChart } from "@/components/charts/tasks-trend-chart";

import { useAuth } from "@/hooks/use-auth";
import { useMemberStats } from "@/hooks/use-dashboard";
import { useTeamReports } from "@/hooks/use-reports";
import { useUser } from "@/hooks/use-users";
import { formatWeekRange } from "@/lib/weeks";
import { fullName } from "@/lib/types";


export default function MemberProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: raw } = use(params);
  const userId = Number(raw);

  const { isManager, isAdmin, user: viewer } = useAuth();
  const isSelf = viewer?.user_id === userId;

  const profile = useUser(userId, { enabled: isAdmin });
  const stats = useMemberStats(userId);
  const reports = useTeamReports({ user_id: userId });

  if (!isManager && !isSelf) {
    return (
      <ErrorState
        error={new Error("You do not have permission to view this.")}
      />
    );
  }

  if (stats.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const person = profile.data ?? (isSelf ? viewer : null);
  return (
    <>
      <PageHeader
        title={person ? fullName(person) : "Team member"}
        description={person?.email}
        action={
          person && <UserAvatar user={person} className="h-12 w-12" />
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Reports submitted"
          value={stats.data?.total_reports ?? 0}
        />

        <MetricCard
          label="Approved"
          value={stats.data?.approved_count ?? 0}
          tone="approved"
        />

        <MetricCard
          label="Needs correction"
          value={stats.data?.needs_correction_count ?? 0}
          tone="correction"
        />

        <MetricCard
          label="Awaiting review"
          value={stats.data?.submitted_count ?? 0}
        />

        <MetricCard
          label="Compliance"
          value={`${stats.data?.compliance_percent ?? 0}%`}
          hint="Since their first report week"
          tone={
            (stats.data?.compliance_percent ?? 0) >= 80
              ? "approved"
              : "correction"
          }
        />
      </div>

      <div className="mb-6">
        <TasksTrendChart userId={userId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report history</CardTitle>
        </CardHeader>

        <CardContent>
          {reports.isPending ? (
            <Skeleton className="h-48 w-full" />
          ) : reports.data && reports.data.items.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="w-40">Status</TableHead>
                    <TableHead className="w-24 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {reports.data.items.map((report) => (
                    <TableRow key={report.report_id}>
                      <TableCell className="font-medium text-body">
                        {formatWeekRange(
                          report.week_start,
                          report.week_end
                        )}
                      </TableCell>

                      <TableCell className="text-subtle">
                        {report.project.name}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={report.status} />
                      </TableCell>

                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/reports/${report.report_id}`}>
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-subtle">
              No reports yet.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
