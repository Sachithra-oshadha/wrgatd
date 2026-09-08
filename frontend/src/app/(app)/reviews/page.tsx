"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Eye, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { StatusBadge } from "@/components/app/status-badge";
import { ProjectBadge } from "@/components/app/project-badge";

import { useTeamReports } from "@/hooks/use-reports";
import { useProjects } from "@/hooks/use-projects";
import { useDirectory } from "@/hooks/use-users";
import { formatWeekRange } from "@/lib/weeks";
import type { ReportStatus } from "@/lib/types";
import { fullName } from "@/lib/types";


const STATUS_OPTIONS: { value: ReportStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "NEEDS_CORRECTION", label: "Needs Correction" },
  { value: "APPROVED", label: "Approved" },
];


export default function ReviewQueuePage() {
  const [status, setStatus] = useState<ReportStatus | "">("SUBMITTED");
  const [projectId, setProjectId] = useState("");
  const [userId, setUserId] = useState("");
  const [weekFrom, setWeekFrom] = useState("");
  const [weekTo, setWeekTo] = useState("");
  const [page, setPage] = useState(1);

  const projects = useProjects();
  const members = useDirectory({ role: "TEAM_MEMBER" });

  const { data, isPending, isError, error, refetch } = useTeamReports({
    status: status || undefined,
    project_id: projectId ? Number(projectId) : undefined,
    user_id: userId ? Number(userId) : undefined,
    week_from: weekFrom || undefined,
    week_to: weekTo || undefined,
    page,
  });

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.page_size))
    : 1;

  function resetPage() {
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Reports submitted by your team, waiting on you."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <select
          value={userId}
          onChange={(event) => {
            setUserId(event.target.value);
            resetPage();
          }}
          className="h-9 rounded-md border bg-card px-3 text-sm"
          aria-label="Team member"
        >
          <option value="">All members</option>

          {members.data?.map((member) => (
            <option key={member.user_id} value={String(member.user_id)}>
              {fullName(member)}
            </option>
          ))}
        </select>

        <select
          value={projectId}
          onChange={(event) => {
            setProjectId(event.target.value);
            resetPage();
          }}
          className="h-9 rounded-md border bg-card px-3 text-sm"
          aria-label="Project"
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

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ReportStatus | "");
            resetPage();
          }}
          className="h-9 rounded-md border bg-card px-3 text-sm"
          aria-label="Status"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label className="flex flex-col gap-1 text-xs text-subtle">
            Week from
            <input
              type="date"
              value={weekFrom}
              onChange={(event) => {
                setWeekFrom(event.target.value);
                resetPage();
              }}
              className="h-9 rounded-md border bg-card px-3 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-subtle">
            Week to
            <input
              type="date"
              value={weekTo}
              onChange={(event) => {
                setWeekTo(event.target.value);
                resetPage();
              }}
              className="h-9 rounded-md border bg-card px-3 text-sm"
            />
          </label>

          {(weekFrom || weekTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setWeekFrom("");
                setWeekTo("");
                resetPage();
              }}
            >
              Clear dates
            </Button>
          )}
        </div>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing found"
          description="No reports match the selected filters."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="w-40">Status</TableHead>
                  <TableHead className="w-20">Version</TableHead>
                  <TableHead className="w-28 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.items.map((report) => (
                  <TableRow key={report.report_id}>
                    <TableCell className="font-medium text-body">
                      {fullName(report.user)}
                    </TableCell>

                    <TableCell>
                      {formatWeekRange(report.week_start, report.week_end)}
                    </TableCell>

                    <TableCell>
                      <ProjectBadge
                        name={report.project.name}
                        isActive={report.project.is_active}
                      />
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={report.status} />
                    </TableCell>

                    <TableCell className="text-subtle">
                      v{report.current_version_number}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/reviews/${report.report_id}`}>
                          {report.status === "SUBMITTED" ? (
                            <>
                              <ClipboardCheck className="h-4 w-4" />
                              Review
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              View
                            </>
                          )}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>

              <span className="text-sm text-subtle">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
