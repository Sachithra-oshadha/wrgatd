"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { toQuery } from "@/lib/query-string";
import type {
  Paginated,
  Report,
  ReportStatus,
  ReportSummary,
} from "@/lib/types";


export interface ReportFilters {
  project_id?: number;
  status?: ReportStatus;
  week_from?: string;
  week_to?: string;
  page?: number;
}


export function useMyReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: queryKeys.reports.mine(filters),
    queryFn: () =>
      apiFetch<Paginated<ReportSummary>>(
        `/reports/my${toQuery(filters)}`
      ),
  });
}


export function useReport(reportId: number | null) {
  return useQuery({
    queryKey: queryKeys.reports.detail(reportId ?? 0),
    queryFn: () => apiFetch<Report>(`/reports/${reportId}`),
    enabled: reportId !== null,
  });
}


export interface ReportPayload {
  project_id: number;
  week_start?: string;
  week_end?: string;
  notes: string | null;
  links: string | null;
  tasks: unknown[];
  next_week_tasks: unknown[];
  blockers: unknown[];
  achievements: unknown[];
  hours: unknown[];
}


export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ReportPayload) =>
      apiFetch<Report>("/reports", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all,
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}


export function useUpdateReport(reportId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Omit<ReportPayload, "week_start" | "week_end">) =>
      apiFetch<Report>(`/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: (report) => {
      queryClient.setQueryData(
        queryKeys.reports.detail(reportId),
        report
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all,
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}


export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: number) =>
      apiFetch(`/reports/${reportId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all,
      });
      toast.success("Draft deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSubmitReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: number) =>
      apiFetch<Report>(`/reports/${reportId}/submit`, {
        method: "POST",
      }),
    onSuccess: (report) => {
      queryClient.setQueryData(
        queryKeys.reports.detail(report.report_id),
        report
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all,
      });
      toast.success("Report submitted for review");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}


export function useReviewReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reportId,
      action,
      comment,
    }: {
      reportId: number;
      action: "approve" | "request-changes";
      comment?: string;
    }) =>
      apiFetch<Report>(`/reports/${reportId}/${action}`, {
        method: "POST",
        body: JSON.stringify({ comment: comment ?? null }),
      }),
    onSuccess: (report, variables) => {
      queryClient.setQueryData(
        queryKeys.reports.detail(report.report_id),
        report
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.activity,
      });

      toast.success(
        variables.action === "approve"
          ? "Report approved"
          : "Changes requested"
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
