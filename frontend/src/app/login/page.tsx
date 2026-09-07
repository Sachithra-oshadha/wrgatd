"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { loginSchema, type LoginValues } from "@/lib/validation/auth";
import type { LoginResponse } from "@/lib/types";
import { BrandPanel } from "@/components/app/brand-panel";


export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}


function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });


  async function onSubmit(values: LoginValues) {
    setServerError("");

    try {
      await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });

      router.push("/dashboard");
      router.refresh();

    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Login failed"
      );
    }
  }


  return (
    <main className="flex min-h-screen bg-background">
      <BrandPanel
        headline="Keep your team's week visible, one report at a time."
        description="Log hours, flag blockers, and let managers review progress without chasing anyone down."
      />

      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 text-2xl font-bold text-heading">
            Sign in
          </h1>

          <p className="mb-6 text-sm text-subtle">
            Sign in to your weekly report account.
          </p>

          {justRegistered && (
            <div className="mb-4 rounded-lg border border-status-approved/25 bg-status-approved/10 p-3 text-sm text-status-approved">
              Account created. Sign in to continue.
            </div>
          )}

          {serverError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-status-late/25 bg-status-late/10 p-3 text-sm text-status-late"
            >
              {serverError}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >

            <div>
              <label className="mb-1.5 block text-sm font-medium text-body">
                Email
                <span className="text-status-late"> *</span>
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" />

                <input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-lg border border-input bg-transparent p-3 pl-10 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              {errors.email && (
                <p className="mt-1 text-sm text-status-late">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-body">
                Password
                <span className="text-status-late"> *</span>
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" />

                <input
                  {...register("password")}
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-input bg-transparent p-3 pl-10 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              {errors.password && (
                <p className="mt-1 text-sm text-status-late">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary p-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-subtle">
            No account yet?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
}
