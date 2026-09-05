"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";


export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<User>("/auth/me")
      .then(setUser)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      );
  }, []);

  async function handleLogout() {
    await apiFetch("/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#F4F6F9] p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">

        <h1 className="mb-4 text-2xl font-bold text-[#222222]">
          Dashboard
        </h1>

        {error && (
          <p className="text-sm text-[#D63939]">{error}</p>
        )}

        {user && (
          <div className="space-y-1 text-sm text-[#333333]">
            <p>
              Signed in as{" "}
              <strong>
                {user.first_name} {user.last_name}
              </strong>
            </p>
            <p className="text-[#666666]">{user.email}</p>
            <p className="text-[#666666]">Role: {user.role}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="mt-6 rounded-md border px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#F4F6F9]"
        >
          Sign out
        </button>

      </div>
    </main>
  );
}
