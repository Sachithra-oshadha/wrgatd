"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { toQuery } from "@/lib/query-string";
import type { Paginated, User, UserDetail, UserRole } from "@/lib/types";
import { toast } from "sonner";


export interface UserFilters {
  search?: string;
  role?: UserRole;
  is_active?: boolean;
}


export function useUsers(
  filters: UserFilters = {},
  options: { enabled?: boolean } = {}
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  params.set("page_size", "100");

  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () =>
      apiFetch<Paginated<UserDetail>>(`/users?${params.toString()}`),
    enabled: options.enabled ?? true,
  });
}

export function useDirectory(filters: { role?: UserRole } = {}) {
  return useQuery({
    queryKey: queryKeys.users.directory(filters),
    queryFn: () => apiFetch<User[]>(`/users/directory${toQuery(filters)}`),
  });
}

export function useUser(
  userId: number | null,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId ?? 0),
    queryFn: () => apiFetch<UserDetail>(`/users/${userId}`),
    enabled: (options.enabled ?? true) && userId !== null,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      role: UserRole;
    }) =>
      apiFetch<UserDetail>("/users", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("User created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}


export function useChangeUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: UserRole }) =>
      apiFetch<UserDetail>(`/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("Role updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}


export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) =>
      apiFetch<UserDetail>(`/users/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("User deactivated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}


export function useReactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) =>
      apiFetch<UserDetail>(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: true }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("User reactivated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
