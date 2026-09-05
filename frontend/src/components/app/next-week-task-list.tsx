"use client";

import { useFieldArray } from "react-hook-form";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { PRIORITIES } from "@/lib/constants";
import type { ReportFormValues } from "@/lib/validation/report";


export function NextWeekTaskList({
  control,
  register,
  errors,
}: {
  control: Control<ReportFormValues>;
  register: UseFormRegister<ReportFormValues>;
  errors: FieldErrors<ReportFormValues>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "next_week_tasks",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks planned for next week</CardTitle>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              description: "",
              priority: "MEDIUM",
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add task
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <p className="py-6 text-center text-sm text-subtle">
            Nothing planned yet. Add what you intend to pick up next week.
          </p>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-3">
              <div className="flex-1">
                <Textarea
                  rows={2}
                  placeholder="What will you work on?"
                  {...register(`next_week_tasks.${index}.description`)}
                />

                {errors.next_week_tasks?.[index]?.description && (
                  <p className="mt-1 text-xs text-status-late">
                    {errors.next_week_tasks[index]?.description?.message}
                  </p>
                )}
              </div>

              <select
                {...register(`next_week_tasks.${index}.priority`)}
                className="h-9 w-32 shrink-0 rounded-md border bg-card px-2 text-sm"
                aria-label="Priority"
              >
                {PRIORITIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4 text-status-late" />
                <span className="sr-only">Remove planned task</span>
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
