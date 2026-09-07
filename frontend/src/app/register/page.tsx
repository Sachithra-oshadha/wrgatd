"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { registerSchema, type RegisterValues } from "@/lib/validation/auth";
import type { User } from "@/lib/types";
import { BrandPanel } from "@/components/app/brand-panel";


export default function RegisterPage() {
  const router = useRouter();

  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });


  async function onSubmit(values: RegisterValues) {
    setServerError("");

    try {
      await apiFetch<User>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          password: values.password,
        }),
      });

      router.push("/login?registered=1");

    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Registration failed"
      );
    }
  }


  return (
    <main className="flex min-h-screen bg-background">
      <BrandPanel
        headline="Bring your whole team onto one weekly rhythm."
        description="Create an account to start logging hours, sharing blockers, and getting reports reviewed."
      />

      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 text-2xl font-bold text-heading">
            Create your account
          </h1>

          <p className="mb-6 text-sm text-subtle">
            Sign up to start submitting weekly reports.
          </p>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-body">
                  First name
                  <span className="text-status-late"> *</span>
                </label>

                <input
                  {...register("first_name")}
                  type="text"
                  autoComplete="given-name"
                  className="w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />

                {errors.first_name && (
                  <p className="mt-1 text-sm text-status-late">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-body">
                  Last name
                  <span className="text-status-late"> *</span>
                </label>

                <input
                  {...register("last_name")}
                  type="text"
                  autoComplete="family-name"
                  className="w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />

                {errors.last_name && (
                  <p className="mt-1 text-sm text-status-late">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

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
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-input bg-transparent p-3 pl-10 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              {errors.password && (
                <p className="mt-1 text-sm text-status-late">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-body">
                Confirm password
                <span className="text-status-late"> *</span>
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" />

                <input
                  {...register("confirm_password")}
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-input bg-transparent p-3 pl-10 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              {errors.confirm_password && (
                <p className="mt-1 text-sm text-status-late">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary p-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-subtle">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
}
