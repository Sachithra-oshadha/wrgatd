"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/app/user-avatar";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { fullName } from "@/lib/types";


export function AppHeader() {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">

      <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-heading">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-action text-sm font-bold text-white">
          W
        </span>

        Weekly Reports
      </Link>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            <UserAvatar user={user} />

            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-body">
                {fullName(user)}
              </p>
              <p className="text-xs text-subtle">
                {user.role.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ")}
              </p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

    </header>
  );
}
