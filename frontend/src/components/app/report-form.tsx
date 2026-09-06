"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "../ui/dialog";

import { WeekPicker } from "@/components/app/week-picker";
import { TaskTable } from "@/components/app/task-table";
import { NextWeekTaskList } from "@/components/app/next-week-task-list";
import { BlockerList } from "@/components/app/blocker-list";
import { AchievementList } from "@/components/app/achievement-list";
import { HoursTable } from "@/components/app/hours-table";

import { useProjects } from "@/hooks/use-projects";
import { useCreateReport, useUpdateReport, useSubmitReport } from "@/hooks/use-reports";
import {
  reportFormSchema,
  type ReportFormValues,
} from "@/lib/validation/report";
import { currentWeekBounds, toApiDate } from "@/lib/weeks";
import type { Report } from "@/lib/types";


function emptyValues(): ReportFormValues {
  const [start, end] = currentWeekBounds();

  return {
    project_id: 0,
    week_start: toApiDate(start),
    week_end: toApiDate(end),
    notes: "",
    links: "",
    tasks: [],
    next_week_tasks: [],
    blockers: [],
    achievements: [],
    hours: [],
  };
}


function valuesFrom(report: Report): ReportFormValues {
  const version = report.current_version;

  return {
    project_id: report.project.project_id,
    week_start: report.week_start,
    week_end: report.week_end,
    notes: report.notes ?? "",
    links: report.links ?? "",
    tasks: version.tasks.map((task) => ({
      task_name: task.task_name,
      priority: task.priority,
      planned_percent:
        task.planned_percent === null ? null : Number(task.planned_percent),
      actual_percent:
        task.actual_percent === null ? null : Number(task.actual_percent),
      status: task.status,
      time_planned:
        task.time_planned === null ? null : Number(task.time_planned),
      time_spent:
        task.time_spent === null ? null : Number(task.time_spent),
      deliverable: task.deliverable ?? "",
    })),
    next_week_tasks: version.next_week_tasks.map((item) => ({
      description: item.description,
      priority: item.priority,
    })),
    blockers: version.blockers.map((item) => ({
      description: item.description,
      is_key_issue: item.is_key_issue,
    })),
    achievements: version.achievements.map((item) => ({
      description: item.description,
      is_key_achievement: item.is_key_achievement,
    })),
    hours: version.hours.map((item) => ({
      task_type: item.task_type,
      hours: Number(item.hours),
    })),
  };
}

export function ReportForm({
  report,
}: {
  report?: Report;
}) {
  const router = useRouter();
  const isEdit = Boolean(report);

  const projects = useProjects({ is_active: true });
  const create = useCreateReport();
  const update = useUpdateReport(report?.report_id ?? 0);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: report ? valuesFrom(report) : emptyValues(),
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = form;

  // useWatch, not watch(): watch() returns a fresh subscription on every
  // render, which the React Compiler cannot memoize.
  const weekStart = useWatch({ control, name: "week_start" });
  const weekEnd = useWatch({ control, name: "week_end" });
  const projectId = useWatch({ control, name: "project_id" });


  async function onSubmit(values: ReportFormValues) {
    const payload = {
      project_id: values.project_id,
      notes: values.notes || null,
      links: values.links || null,
      tasks: values.tasks,
      next_week_tasks: values.next_week_tasks,
      blockers: values.blockers,
      achievements: values.achievements,
      hours: values.hours,
    };

    if (isEdit && report) {
      await update.mutateAsync(payload);
      toast.success("Draft saved");
      return;
    }

    const created = await create.mutateAsync({
      ...payload,
      week_start: values.week_start,
      week_end: values.week_end,
    });

    toast.success("Draft created");
    router.replace(`/reports/${created.report_id}/edit`);
  }

  const submitReport = useSubmitReport();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const status = report?.status;
  const isCorrection = status === "NEEDS_CORRECTION";

  async function handleSubmitForReview() {
    const id = report?.report_id;

    if (!id) {
      toast.error("Save the draft before submitting");
      setConfirmOpen(false);
      return;
    }

    // Always save first, so what the manager reviews is what is on
    // screen. `saved` is set inside the handler rather than read from
    // `errors` afterwards: `errors` here is the value captured when this
    // callback was created, so a validation failure raised by this very
    // call would not be visible in it, and we would go on to submit an
    // unsaved report.
    let saved = false;

    try {
      await handleSubmit(async (values) => {
        await onSubmit(values);
        saved = true;
      })();
    } catch {
      // the mutation's onError already surfaced a toast
      saved = false;
    }

    if (!saved) {
      setConfirmOpen(false);
      return;
    }

    try {
      await submitReport.mutateAsync(id);
    } catch {
      setConfirmOpen(false);
      return;
    }

    setConfirmOpen(false);
    router.push(`/reports/${id}`);
  }


  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 pb-24"
      noValidate
    >

      {/* Section 1 - week and project */}
      <Card>
        <CardHeader>
          <CardTitle>Reporting period</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-wrap items-end gap-6">
          <div className="space-y-2">
            <Label>Week</Label>

            <WeekPicker
              weekStart={weekStart}
              weekEnd={weekEnd}
              disabled={isEdit}
              onChange={(start, end) => {
                setValue("week_start", start, { shouldDirty: true });
                setValue("week_end", end, { shouldDirty: true });
              }}
            />

            {isEdit && (
              <p className="text-xs text-subtle">
                The week cannot be changed after a report is created.
              </p>
            )}
          </div>

          <div className="min-w-56 space-y-2">
            <Label>Project</Label>

            <Select
              value={projectId ? String(projectId) : ""}
              onValueChange={(value) =>
                setValue("project_id", Number(value), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>

              <SelectContent>
                {projects.data?.items.map((project) => (
                  <SelectItem
                    key={project.project_id}
                    value={String(project.project_id)}
                  >
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.project_id && (
              <p className="text-sm text-status-late">
                {errors.project_id.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sections 2-6 */}
      <TaskTable control={control} register={register} errors={errors} />

      <NextWeekTaskList
        control={control}
        register={register}
        errors={errors}
      />

      <BlockerList
        control={control}
        register={register}
        setValue={setValue}
        errors={errors}
      />

      <AchievementList
        control={control}
        register={register}
        setValue={setValue}
        errors={errors}
      />

      <HoursTable control={control} register={register} errors={errors} />

      {/* Section 7 - notes and links */}
      <Card>
        <CardHeader>
          <CardTitle>Notes and links</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={4} {...register("notes")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="links">Links</Label>

            <Textarea
              id="links"
              rows={2}
              placeholder="One URL per line"
              {...register("links")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sticky action bar */}
       <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-card px-6 py-3 md:left-56">
        <div className="flex items-center justify-end gap-3">
          <span className="mr-auto text-sm text-subtle">
            {isDirty ? "Unsaved changes" : "All changes saved"}
          </span>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/reports/history")}
          >
            Cancel
          </Button>

          <Button type="submit" variant="outline" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Draft"}
          </Button>

          <Button
            type="button"
            disabled={!report || submitReport.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            {isCorrection ? "Resubmit for Review" : "Submit for Review"}
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isCorrection ? "Resubmit this report?" : "Submit for review?"}
            </DialogTitle>

            <DialogDescription>
              {isCorrection
                ? "Your corrections go to your manager as a new version. The version they already reviewed is kept unchanged."
                : "Your manager will be able to review this report. You will not be able to edit it again unless changes are requested."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Keep editing
            </Button>

            <Button
              type="button"
              onClick={handleSubmitForReview}
              disabled={submitReport.isPending}
            >
              {submitReport.isPending ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </form>
  );
}
