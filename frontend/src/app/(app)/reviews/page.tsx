"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Inbox } from "lucide-react";

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
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [projectId, setProjectId] = useState("");
  const [page, setPage] = useState(1);

  const projects = useProjects();

  const { data, isPending, isError, error, refetch } = useTeamReports({
    status: "SUBMITTED",
    page,
  });

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.page_size))
    : 1;


  return (
    <>
      <PageHeader
        title="Reviews"
        description="Reports submitted by your team, waiting on you."
      />

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing to review"
          description="Submitted reports will show up here."
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
                          <ClipboardCheck className="h-4 w-4" />
                          Review
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
