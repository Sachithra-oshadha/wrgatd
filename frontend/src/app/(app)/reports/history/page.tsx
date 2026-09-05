"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

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

import { useMyReports } from "@/hooks/use-reports";
import { useProjects } from "@/hooks/use-projects";
import { formatWeekRange } from "@/lib/weeks";
import type { ReportStatus } from "@/lib/types";


const STATUS_OPTIONS: { value: ReportStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "NEEDS_CORRECTION", label: "Needs Correction" },
  { value: "APPROVED", label: "Approved" },
];


export default function ReportHistoryPage() {
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [projectId, setProjectId] = useState("");
  const [page, setPage] = useState(1);

  const projects = useProjects();

  const { data, isPending, isError, error, refetch } = useMyReports({
    status: status || undefined,
    project_id: projectId ? Number(projectId) : undefined,
    page,
  });

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.page_size))
    : 1;


  return (
    <>
      <PageHeader
        title="My reports"
        description="Every weekly report you have filed."
        action={
          <Button asChild>
            <Link href="/reports/new">
              <Plus className="mr-2 h-4 w-4" />
              New report
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ReportStatus | "");
            setPage(1);
          }}
          className="h-9 rounded-md border bg-card px-3 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={projectId}
          onChange={(event) => {
            setProjectId(event.target.value);
            setPage(1);
          }}
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

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Create your first weekly report to get started."
          action={
            <Button asChild>
              <Link href="/reports/new">New report</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="w-40">Status</TableHead>
                  <TableHead className="w-20">Version</TableHead>
                  <TableHead className="w-28 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.items.map((report) => {
                  const editable =
                    report.status === "DRAFT" ||
                    report.status === "NEEDS_CORRECTION";

                  return (
                    <TableRow key={report.report_id}>
                      <TableCell className="font-medium text-body">
                        {formatWeekRange(
                          report.week_start,
                          report.week_end
                        )}
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
                          <Link
                            href={
                              editable
                                ? `/reports/${report.report_id}/edit`
                                : `/reports/${report.report_id}`
                            }
                          >
                            {editable ? "Edit" : "View"}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
