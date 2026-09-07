"use client";

import { useState } from "react";
import { Plus, Search, UserCog, UserX, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { UserAvatar } from "@/components/app/user-avatar";
import { UserCreateDialog } from "@/components/app/user-create-dialog";
import { ConfirmDialog } from "@/components/app/confirm-dialog";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import {
  useChangeUserRole,
  useDeactivateUser,
  useReactivateUser,
  useUsers,
} from "@/hooks/use-users";
import { fullName, type UserRole } from "@/lib/types";


const ROLE_LABELS: Record<UserRole, string> = {
  TEAM_MEMBER: "Team Member",
  MANAGER: "Manager",
  ADMIN: "Admin",
};

const ROLE_BADGE_VARIANT: Record<
  UserRole,
  "default" | "secondary" | "outline"
> = {
  ADMIN: "default",
  MANAGER: "secondary",
  TEAM_MEMBER: "outline",
};

type StatusFilter = "all" | "active" | "inactive";


export default function UsersPage() {
  const { user: currentUser, isAdmin, isLoading: authLoading } = useAuth();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [creating, setCreating] = useState(false);
  const [deactivating, setDeactivating] = useState<
    { user_id: number; first_name: string; last_name: string } | null
  >(null);

  const { data, isPending, isError, error, refetch } = useUsers(
    {
      search: search || undefined,
      role: roleFilter === "all" ? undefined : roleFilter,
      is_active:
        statusFilter === "all" ? undefined : statusFilter === "active",
    },
    { enabled: isAdmin }
  );

  const changeRole = useChangeUserRole();
  const deactivate = useDeactivateUser();
  const reactivate = useReactivateUser();


  return (
    <>
      <PageHeader
        title="Users"
        description="Manage accounts, roles and access."
        action={
          isAdmin && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-faint" />

          <Input
            placeholder="Search users..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-8"
          />
        </div>

        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value as UserRole | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((value) => (
              <SelectItem key={value} value={value}>
                {ROLE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {authLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : !isAdmin ? (
        <ErrorState
          error={new ApiError("You do not have permission to view this.", 403)}
        />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No users found"
          description="Try a different search or filter."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="w-44">Role</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.items.map((user) => {
                const isSelf = user.user_id === currentUser?.user_id;

                return (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} />

                        <div>
                          <p className="font-medium text-body">
                            {fullName(user)}
                            {isSelf && (
                              <span className="ml-1.5 text-xs text-subtle">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-subtle">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Select
                        value={user.role}
                        disabled={isSelf || changeRole.isPending}
                        onValueChange={(value) =>
                          changeRole.mutate({
                            userId: user.user_id,
                            role: value as UserRole,
                          })
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue>
                            <Badge variant={ROLE_BADGE_VARIANT[user.role]}>
                              {ROLE_LABELS[user.role]}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>

                        <SelectContent>
                          {(Object.keys(ROLE_LABELS) as UserRole[]).map(
                            (value) => (
                              <SelectItem key={value} value={value}>
                                {ROLE_LABELS[value]}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <span
                        className={
                          user.is_active
                            ? "text-sm text-status-approved"
                            : "text-sm text-faint"
                        }
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      {user.is_active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isSelf || deactivate.isPending}
                          onClick={() => setDeactivating(user)}
                        >
                          <UserX className="h-4 w-4 text-status-late" />
                          <span className="text-status-late">Deactivate</span>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={reactivate.isPending}
                          onClick={() => reactivate.mutate(user.user_id)}
                        >
                          <UserCheck className="h-4 w-4 text-status-approved" />
                          Reactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <UserCreateDialog open={creating} onOpenChange={setCreating} />

      <ConfirmDialog
        open={deactivating !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivating(null);
        }}
        title={
          deactivating ? `Deactivate ${fullName(deactivating)}?` : ""
        }
        description="They will no longer be able to sign in. You can reactivate this account at any time."
        confirmLabel="Deactivate"
        destructive
        loading={deactivate.isPending}
        onConfirm={async () => {
          if (!deactivating) return;
          await deactivate.mutateAsync(deactivating.user_id);
          setDeactivating(null);
        }}
      />
    </>
  );
}
