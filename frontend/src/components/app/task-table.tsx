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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { RequiredMark } from "@/components/app/required-mark";
import { PRIORITY_SELECT_CLASSES } from "@/lib/priority-colors";
import { PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { optionalNumberField } from "@/lib/forms";
import type { ReportFormValues } from "@/lib/validation/report";


export function TaskTable({
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
    name: "tasks",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks completed this week</CardTitle>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              task_name: "",
              priority: "MEDIUM",
              planned_percent: null,
              actual_percent: null,
              status: "NOT_STARTED",
              time_planned: null,
              time_spent: null,
              deliverable: "",
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add task
        </Button>
      </CardHeader>

      <CardContent>
        {fields.length === 0 ? (
          <p className="py-6 text-center text-sm text-subtle">
            No tasks yet. Add the work you completed this week.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-52">
                    Task
                    <RequiredMark />
                  </TableHead>
                  <TableHead className="w-32">Priority</TableHead>
                  <TableHead className="w-24">Planned %</TableHead>
                  <TableHead className="w-24">Actual %</TableHead>
                  <TableHead className="w-36">Status</TableHead>
                  <TableHead className="w-24">Planned hrs</TableHead>
                  <TableHead className="w-24">Spent hrs</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Input
                        {...register(`tasks.${index}.task_name`)}
                        placeholder="What did you work on?"
                      />

                      {errors.tasks?.[index]?.task_name && (
                        <p className="mt-1 text-xs text-status-late">
                          {errors.tasks[index]?.task_name?.message}
                        </p>
                      )}
                    </TableCell>

                    <TableCell>
                      <select
                        {...register(`tasks.${index}.priority`, {
                          onChange: (event) => {
                            event.target.dataset.priority = event.target.value;
                          },
                        })}
                        defaultValue={field.priority}
                        data-priority={field.priority}
                        className={PRIORITY_SELECT_CLASSES}
                      >
                        {PRIORITIES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </TableCell>

                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        {...register(
                          `tasks.${index}.planned_percent`,
                          optionalNumberField
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        {...register(
                          `tasks.${index}.actual_percent`,
                          optionalNumberField
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <select
                        {...register(`tasks.${index}.status`)}
                        className="h-9 w-full rounded-md border bg-card px-2 text-sm"
                      >
                        {TASK_STATUSES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </TableCell>

                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.25"
                        {...register(
                          `tasks.${index}.time_planned`,
                          optionalNumberField
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.25"
                        {...register(
                          `tasks.${index}.time_spent`,
                          optionalNumberField
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-status-late" />
                        <span className="sr-only">Remove task</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
