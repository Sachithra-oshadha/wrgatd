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
  Project,
  ProjectMember,
} from "@/lib/types";


export interface ProjectFilters {
  search?: string;
  is_active?: boolean;
}

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: () =>
      apiFetch<Paginated<Project>>(`/projects${toQuery(filters)}`),
  });
}


export function useProjectMembers(projectId: number | null) {
  return useQuery({
    queryKey: queryKeys.projects.members(projectId ?? 0),
    queryFn: () =>
      apiFetch<ProjectMember[]>(`/projects/${projectId}/members`),
    enabled: projectId !== null,
  });
}


export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name: string; description?: string | null }) =>
      apiFetch<Project>("/projects", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.all,
      });
      toast.success(`Project "${project.name}" created`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}


export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      ...body
    }: {
      projectId: number;
      name?: string;
      description?: string | null;
      is_active?: boolean;
    }) =>
      apiFetch<Project>(`/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.all,
      });
      toast.success("Project updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}


export function useDeactivateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: number) =>
      apiFetch<Project>(`/projects/${projectId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.all,
      });
      toast.success("Project removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}


export function useAddProjectMember(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) =>
      apiFetch<ProjectMember>(`/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.members(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.all,
      });
      toast.success("Member assigned");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}


export function useRemoveProjectMember(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) =>
      apiFetch(`/projects/${projectId}/members/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.members(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.all,
      });
      toast.success("Member removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
