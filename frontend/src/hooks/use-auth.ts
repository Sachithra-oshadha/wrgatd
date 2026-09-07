"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { User } from "@/lib/types";


export function useAuth() {
    const { data: user, isPending, isError } = useQuery({
        queryKey: queryKeys.me,
        queryFn: () => apiFetch<User>("/auth/me"),
        staleTime: 5 * 60_000,
        retry: false,
    });

    return {
        user: user ?? null,
        isLoading: isPending,
        isError,
        isManager: user?.role === "MANAGER" || user?.role === "ADMIN",
        isAdmin: user?.role === "ADMIN",
    };
}


export function useLogout() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () =>
            apiFetch("/auth/logout", { method: "POST" }),
        onSuccess: () => {
            queryClient.clear();
            router.push("/login");
            router.refresh();
        },
    });
}