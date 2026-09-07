"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseISO } from "date-fns";

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

import { MetricCard } from "@/components/app/metric-card";
import { StatusBadge } from "@/components/app/status-badge";
import { UserAvatar } from "@/components/app/user-avatar";
import { ActivityItem } from "@/components/app/activity-item";
import { StatusDistribution } from "@/components/charts/status-distribution";
import { TasksTrendChart } from "@/components/charts/tasks-trend-chart";
import { WorkloadChart } from "@/components/charts/workload-chart";
import { HoursChart } from "@/components/charts/hours-chart";

import { useProjects } from "@/hooks/use-projects";
import {
  useActivity,
  useSubmissions,
  useTeamDashboard,
} from "@/hooks/use-dashboard";
import {
  currentWeekBounds,
  formatWeekRange,
  shiftWeek,
  toApiDate,
} from "@/lib/weeks";


export function TeamDashboard({ compact = false }: { compact?: boolean }) {
  const [start, end] = currentWeekBounds();

  const [weekStart, setWeekStart] = useState(toApiDate(start));
  const [weekEnd, setWeekEnd] = useState(toApiDate(end));
  const [projectId, setProjectId] = useState("");

  const filters = {
    week_start: weekStart,
    project_id: projectId ? Number(projectId) : undefined,
  };

  const projects = useProjects({ is_active: true });
  const summary = useTeamDashboard(filters);
  const submissions = useSubmissions(filters);
  const activity = useActivity(8);

  function moveWeek(delta: number) {
    const [nextStart, nextEnd] = shiftWeek(parseISO(weekStart), delta);
    setWeekStart(toApiDate(nextStart));
    setWeekEnd(toApiDate(nextEnd));
  }

  const data = summary.data;
  const members = submissions.data ?? [];

  return (
    <div className={compact ? "mt-8 space-y-6" : "space-y-6"}>

      {compact && (
        <h2 className="text-lg font-semibold text-heading">Team overview</h2>
      )}

      {/* Phase 25 filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => moveWeek(-1)}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="min-w-48 rounded-md border bg-card px-4 py-2 text-center text-sm font-medium text-body">
            {formatWeekRange(weekStart, weekEnd)}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => moveWeek(1)}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <select
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
          className="h-9 rounded-md border bg-card px-3 text-sm"
        >
          <option value="">All projects</option>

          {projects.data?.items.map((project) => (
            <option
              key={project.project_id}
              value={String(project.project_id)}
            >
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Phase 25 metrics */}
      {summary.isPending || !data ? (
        <Skeleton className="h-28 w-full" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Submitted"
            value={data.submitted_count}
            hint={`of ${data.expected_reports} expected`}
          />

          <MetricCard
            label="Compliance"
            value={`${data.compliance_percent}%`}
            tone={data.compliance_percent >= 80 ? "approved" : "correction"}
          />

          <MetricCard
            label="Needs correction"
            value={data.needs_correction_count}
            tone={
              data.needs_correction_count > 0 ? "correction" : "default"
            }
          />

          <MetricCard
            label="Open blockers"
            value={data.open_blockers}
            tone={data.open_blockers > 0 ? "late" : "default"}
            hint="On current versions of unapproved reports"
          />
        </div>
      )}

      {/* Phase 27 charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StatusDistribution
          submissions={members}
          isLoading={submissions.isPending}
        />

        <TasksTrendChart
          projectId={projectId ? Number(projectId) : undefined}
        />

        <WorkloadChart weekStart={weekStart} />

        <HoursChart weekStart={weekStart} />
      </div>
      {/* Phase 26 team table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team reports</CardTitle>
        </CardHeader>

        <CardContent>
          {submissions.isPending ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="w-44">Status</TableHead>
                    <TableHead className="w-28 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.user_id}>
                      <TableCell>
                        <Link
                          href={`/team/${member.user_id}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <UserAvatar user={member} />

                          <span className="font-medium text-body">
                            {member.first_name} {member.last_name}
                          </span>
                        </Link>
                      </TableCell>

                      <TableCell className="text-subtle">
                        {member.project ?? "—"}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={member.status} />
                      </TableCell>

                      <TableCell className="text-right">
                        {member.report_id ? (
                          <Button asChild variant="ghost" size="sm">
                            <Link
                              href={
                                member.status === "SUBMITTED"
                                  ? `/reviews/${member.report_id}`
                                  : `/reports/${member.report_id}`
                              }
                            >
                              {member.status === "SUBMITTED"
                                ? "Review"
                                : "View"}
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-sm text-faint">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase 27 activity feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>

        <CardContent className="space-y-1">
          {activity.isPending ? (
            <Skeleton className="h-32 w-full" />
          ) : activity.data && activity.data.length > 0 ? (
            activity.data.map((event) => (
              <ActivityItem
                key={`${event.kind}-${event.report_id}-${event.at}`}
                event={event}
              />
            ))
          ) : (
            <p className="py-6 text-center text-sm text-subtle">
              Nothing has happened yet.
            </p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
