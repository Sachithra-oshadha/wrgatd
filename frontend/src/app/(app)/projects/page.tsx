"use client";

import { useState } from "react";
import { FolderKanban, Pencil, Plus, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ProjectDialog } from "@/components/app/project-dialog";
import { ProjectMembersDialog } from "@/components/app/project-members-dialog";

import { useAuth } from "@/hooks/use-auth";
import {
  useDeactivateProject,
  useProjects,
} from "@/hooks/use-projects";
import type { Project } from "@/lib/types";


export default function ProjectsPage() {
  const { isManager } = useAuth();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [managingMembers, setManagingMembers] = useState<Project | null>(null);

  const { data, isPending, isError, error, refetch } = useProjects({
    search: search || undefined,
  });

  const deactivate = useDeactivateProject();


  return (
    <>
      <PageHeader
        title="Projects"
        description="Projects and categories reports can be filed against."
        action={
          isManager && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          )
        }
      />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={
            isManager
              ? "Create your first project so the team can file reports against it."
              : "A manager has not created any projects yet."
          }
          action={
            isManager && (
              <Button onClick={() => setCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="w-28">Members</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.items.map((project) => (
                <TableRow key={project.project_id}>
                  <TableCell>
                    <p className="font-medium text-body">{project.name}</p>

                    {project.description && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-subtle">
                        {project.description}
                      </p>
                    )}
                  </TableCell>

                  <TableCell className="text-subtle">
                    {project.member_count}
                  </TableCell>

                  <TableCell>
                    <span
                      className={
                        project.is_active
                          ? "text-sm text-status-approved"
                          : "text-sm text-faint"
                      }
                    >
                      {project.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setManagingMembers(project)}
                    >
                      <Users className="h-4 w-4" />
                      <span className="sr-only">Manage members</span>
                    </Button>

                    {isManager && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(project)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deactivate.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove "${project.name}"? Projects with existing reports are deactivated rather than deleted.`
                              )
                            ) {
                              deactivate.mutate(project.project_id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-status-late" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ProjectDialog
        open={creating || editing !== null}
        project={editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      />

      <ProjectMembersDialog
        project={managingMembers}
        onOpenChange={(open) => {
          if (!open) setManagingMembers(null);
        }}
      />
    </>
  );
}
