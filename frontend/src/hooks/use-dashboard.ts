"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { toQuery } from "@/lib/query-string";
import type {
  ActivityEvent,
  HoursPoint,
  MemberSection,
  MemberStats,
  MemberSubmission,
  PersonalSummary,
  SectionType,
  TasksTrendPoint,
  TeamSummary,
  WorkloadPoint,
} from "@/lib/types";


export interface WeekFilters {
  week_start?: string;
  project_id?: number;
}


export function usePersonalDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.me,
    queryFn: () => apiFetch<PersonalSummary>("/dashboard/me"),
  });
}


export function useTeamDashboard(filters: WeekFilters = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard.team(filters),
    queryFn: () =>
      apiFetch<TeamSummary>(`/dashboard/team${toQuery(filters)}`),
  });
}


export function useTasksTrend(
  filters: { weeks?: number; user_id?: number; project_id?: number } = {}
) {
  return useQuery({
    queryKey: queryKeys.dashboard.tasksTrend(filters),
    queryFn: () =>
      apiFetch<TasksTrendPoint[]>(
        `/dashboard/tasks-trend${toQuery(filters)}`
      ),
  });
}


export function useWorkload(
  filters: { week_start?: string; user_id?: number } = {}
) {
  return useQuery({
    queryKey: queryKeys.dashboard.workload(filters),
    queryFn: () =>
      apiFetch<WorkloadPoint[]>(`/dashboard/workload${toQuery(filters)}`),
  });
}


export function useHoursBreakdown(
  filters: { week_start?: string; user_id?: number } = {}
) {
  return useQuery({
    queryKey: queryKeys.dashboard.hours(filters),
    queryFn: () =>
      apiFetch<HoursPoint[]>(
        `/dashboard/hours-breakdown${toQuery(filters)}`
      ),
  });
}


export function useSubmissions(filters: WeekFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.team(filters), "submissions"],
    queryFn: () =>
      apiFetch<MemberSubmission[]>(
        `/dashboard/submissions${toQuery(filters)}`
      ),
  });
}


export function useActivity(limit = 15) {
  return useQuery({
    queryKey: queryKeys.dashboard.activity,
    queryFn: () =>
      apiFetch<ActivityEvent[]>(`/dashboard/activity?limit=${limit}`),
  });
}


export function useTeamSections(
  filters: WeekFilters & { section: SectionType }
) {
  return useQuery({
    queryKey: queryKeys.dashboard.sections(filters),
    queryFn: () =>
      apiFetch<MemberSection[]>(`/dashboard/sections${toQuery(filters)}`),
  });
}


export function useMemberStats(userId: number | null) {
  return useQuery({
    queryKey: queryKeys.users.stats(userId ?? 0),
    queryFn: () => apiFetch<MemberStats>(`/users/${userId}/stats`),
    enabled: userId !== null,
  });
}
