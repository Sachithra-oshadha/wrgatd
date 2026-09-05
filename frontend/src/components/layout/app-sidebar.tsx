"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Users,
  UserCog,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/lib/types";


interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports/history", label: "My Reports", icon: FileText },
  {
    href: "/team",
    label: "Team",
    icon: Users,
    roles: ["MANAGER", "ADMIN"],
  },
  {
    href: "/reviews",
    label: "Reviews",
    icon: BarChart3,
    roles: ["MANAGER", "ADMIN"],
  },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
  },
  {
    href: "/users",
    label: "Users",
    icon: UserCog,
    roles: ["ADMIN"],
  },
];


export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = NAV.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-card md:block">
      <nav className="flex flex-col gap-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-subtle hover:bg-muted hover:text-body"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
