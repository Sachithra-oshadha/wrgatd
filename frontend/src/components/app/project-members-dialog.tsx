"use client";

import { useState } from "react";
import { X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { UserAvatar } from "@/components/app/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-users";
import {
  useAddProjectMember,
  useProjectMembers,
  useRemoveProjectMember,
} from "@/hooks/use-projects";
import { fullName, type Project } from "@/lib/types";


export function ProjectMembersDialog({
  project,
  onOpenChange,
}: {
  project: Project | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { isManager, isAdmin } = useAuth();
  const [selected, setSelected] = useState("");

  const projectId = project?.project_id ?? null;

  const members = useProjectMembers(projectId);
  const addMember = useAddProjectMember(projectId ?? 0);
  const removeMember = useRemoveProjectMember(projectId ?? 0);

  // GET /users is admin-only - see the note below this component
  const users = useUsers({ is_active: true }, { enabled: isAdmin });

  const memberIds = new Set(
    members.data?.map((member) => member.user.user_id) ?? []
  );

  const assignable =
    users.data?.items.filter((user) => !memberIds.has(user.user_id)) ?? [];


  return (
    <Dialog open={project !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project?.name} — members</DialogTitle>

          <DialogDescription>
            People assigned to this project.
          </DialogDescription>
        </DialogHeader>

        {isAdmin && (
          <div className="flex gap-2">
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a person to assign" />
              </SelectTrigger>

              <SelectContent>
                {assignable.map((user) => (
                  <SelectItem
                    key={user.user_id}
                    value={String(user.user_id)}
                  >
                    {fullName(user)} — {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              disabled={!selected || addMember.isPending}
              onClick={async () => {
                await addMember.mutateAsync(Number(selected));
                setSelected("");
              }}
            >
              Assign
            </Button>
          </div>
        )}

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {members.isPending ? (
            <Skeleton className="h-10 w-full" />
          ) : members.data && members.data.length > 0 ? (
            members.data.map((member) => (
              <div
                key={member.project_member_id}
                className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
              >
                <UserAvatar user={member.user} />

                <div className="flex-1">
                  <p className="text-sm font-medium text-body">
                    {fullName(member.user)}
                  </p>
                  <p className="text-xs text-subtle">
                    {member.user.email}
                  </p>
                </div>

                {isManager && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={removeMember.isPending}
                    onClick={() =>
                      removeMember.mutate(member.user.user_id)
                    }
                  >
                    <X className="h-4 w-4 text-status-late" />
                    <span className="sr-only">Remove</span>
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-subtle">
              No members assigned yet.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
