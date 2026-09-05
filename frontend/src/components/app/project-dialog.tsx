"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  useCreateProject,
  useUpdateProject,
} from "@/hooks/use-projects";
import {
  projectSchema,
  type ProjectValues,
} from "@/lib/validation/project";
import type { Project } from "@/lib/types";


export function ProjectDialog({
  open,
  project,
  onOpenChange,
}: {
  open: boolean;
  project: Project | null;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateProject();
  const update = useUpdateProject();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: project?.name ?? "",
        description: project?.description ?? "",
      });
    }
  }, [open, project, reset]);


  async function onSubmit(values: ProjectValues) {
    const body = {
      name: values.name,
      description: values.description || null,
    };

    if (project) {
      await update.mutateAsync({
        projectId: project.project_id,
        ...body,
      });
    } else {
      await create.mutateAsync(body);
    }

    onOpenChange(false);
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {project ? "Edit project" : "Create project"}
          </DialogTitle>

          <DialogDescription>
            Projects group weekly reports. Names must be unique.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>

            <Input id="project-name" {...register("name")} />

            {errors.name && (
              <p className="text-sm text-status-late">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>

            <Textarea
              id="project-description"
              rows={3}
              {...register("description")}
            />

            {errors.description && (
              <p className="text-sm text-status-late">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {project ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
