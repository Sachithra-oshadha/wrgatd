"use client";

import { useFieldArray, useWatch } from "react-hook-form";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { RequiredMark } from "@/components/app/required-mark";
import type { ReportFormValues } from "@/lib/validation/report";


export function BlockerList({
  control,
  register,
  setValue,
  errors,
}: {
  control: Control<ReportFormValues>;
  register: UseFormRegister<ReportFormValues>;
  setValue: UseFormSetValue<ReportFormValues>;
  errors: FieldErrors<ReportFormValues>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "blockers",
  });

  const blockers = useWatch({ control, name: "blockers" }) ?? [];

  /**
   * At most one blocker may be the key issue (Phase 10). Ticking one
   * unticks the rest, so the rule is enforced in the UI rather than
   * only discovered when the server rejects the save.
   */
  function markAsKeyIssue(index: number, checked: boolean) {
    blockers.forEach((_, i) => {
      setValue(`blockers.${i}.is_key_issue`, checked && i === index, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Blockers and challenges</CardTitle>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              description: "",
              is_key_issue: false,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add blocker
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <p className="py-6 text-center text-sm text-subtle">
            No blockers this week.
          </p>
        ) : (
          <>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3">
                <div className="flex-1">
                  <Label
                    htmlFor={`blocker-${field.id}`}
                    className="mb-1 text-xs font-normal text-subtle"
                  >
                    Description
                    <RequiredMark />
                  </Label>

                  <Textarea
                    id={`blocker-${field.id}`}
                    rows={2}
                    placeholder="What is holding you up?"
                    {...register(`blockers.${index}.description`)}
                  />

                  {errors.blockers?.[index]?.description && (
                    <p className="mt-1 text-xs text-status-late">
                      {errors.blockers[index]?.description?.message}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <Checkbox
                      id={`blocker-key-${field.id}`}
                      checked={blockers[index]?.is_key_issue ?? false}
                      onCheckedChange={(checked) =>
                        markAsKeyIssue(index, checked === true)
                      }
                    />

                    <Label
                      htmlFor={`blocker-key-${field.id}`}
                      className="text-xs font-normal text-subtle"
                    >
                      Key issue
                    </Label>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-status-late" />
                  <span className="sr-only">Remove blocker</span>
                </Button>
              </div>
            ))}

            {errors.blockers?.root && (
              <p className="text-sm text-status-late">
                {errors.blockers.root.message}
              </p>
            )}

            {typeof errors.blockers?.message === "string" && (
              <p className="text-sm text-status-late">
                {errors.blockers.message}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
