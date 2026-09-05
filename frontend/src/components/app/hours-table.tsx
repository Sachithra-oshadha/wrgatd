"use client";

import { useFieldArray, useWatch } from "react-hook-form";
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

import { HOUR_CATEGORIES } from "@/lib/constants";
import { requiredNumberField } from "@/lib/forms";
import type { ReportFormValues } from "@/lib/validation/report";


export function HoursTable({
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
    name: "hours",
  });

  const rows = useWatch({ control, name: "hours" }) ?? [];

  const total = rows.reduce(
    (sum, entry) => sum + (Number(entry?.hours) || 0),
    0
  );

  // the first category not already used, so a new row is rarely a duplicate
  const nextCategory =
    HOUR_CATEGORIES.find(
      (category) => !rows.some((entry) => entry?.task_type === category)
    ) ?? HOUR_CATEGORIES[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Hours worked</CardTitle>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              task_type: nextCategory,
              hours: 0,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add category
        </Button>
      </CardHeader>

      <CardContent>
        {fields.length === 0 ? (
          <p className="py-6 text-center text-sm text-subtle">
            No hours recorded yet.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-32">Hours</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <select
                          {...register(`hours.${index}.task_type`)}
                          className="h-9 w-full rounded-md border bg-card px-2 text-sm"
                          aria-label="Category"
                        >
                          {HOUR_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>

                        {errors.hours?.[index]?.task_type && (
                          <p className="mt-1 text-xs text-status-late">
                            {errors.hours[index]?.task_type?.message}
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.25"
                          aria-label="Hours"
                          {...register(
                            `hours.${index}.hours`,
                            requiredNumberField
                          )}
                        />

                        {errors.hours?.[index]?.hours && (
                          <p className="mt-1 text-xs text-status-late">
                            {errors.hours[index]?.hours?.message}
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-status-late" />
                          <span className="sr-only">Remove category</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
              <span className="font-medium text-heading">Total</span>

              <span
                className={
                  total > 60
                    ? "font-semibold text-status-correction"
                    : "font-semibold text-heading"
                }
              >
                {total}h
                {total > 60 && (
                  <span className="ml-2 text-xs font-normal">
                    that is a lot for one week - check for a typo
                  </span>
                )}
              </span>
            </div>

            {errors.hours?.root && (
              <p className="mt-2 text-sm text-status-late">
                {errors.hours.root.message}
              </p>
            )}

            {typeof errors.hours?.message === "string" && (
              <p className="mt-2 text-sm text-status-late">
                {errors.hours.message}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
