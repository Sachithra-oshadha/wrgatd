"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { apiFetch } from "@/lib/api";
import { loginSchema, type LoginValues } from "@/lib/validation/auth";
import type { LoginResponse } from "@/lib/types";


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
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">

        <h1 className="mb-2 text-2xl font-bold text-[#222222]">
          Sign in
        </h1>

        <p className="mb-6 text-sm text-[#666666]">
          Sign in to your weekly report account.
        </p>

        {justRegistered && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-[#2E865F]">
            Account created. Sign in to continue.
          </div>
        )}

        {serverError && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-[#D63939]"
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
            <label className="mb-1 block text-sm font-medium text-[#333333]">
              Email
            </label>

            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              className="w-full rounded-md border p-3"
            />

            {errors.email && (
              <p className="mt-1 text-sm text-[#D63939]">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333333]">
              Password
            </label>

            <input
              {...register("password")}
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md border p-3"
            />

            {errors.password && (
              <p className="mt-1 text-sm text-[#D63939]">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[#0D6EFD] p-3 font-medium text-white hover:bg-[#0B5ED7] disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-[#666666]">
          No account yet?{" "}
          <Link href="/register" className="text-[#1E90FF] hover:underline">
            Create one
          </Link>
        </p>

      </div>
    </main>
  );
}
