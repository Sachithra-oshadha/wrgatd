"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Paginated, UserDetail, UserRole } from "@/lib/types";


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
