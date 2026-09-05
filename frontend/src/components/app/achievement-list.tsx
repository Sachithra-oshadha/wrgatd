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

import type { ReportFormValues } from "@/lib/validation/report";


export function AchievementList({
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
    name: "achievements",
  });

  const achievements = useWatch({ control, name: "achievements" }) ?? [];

  /** At most one achievement may be the key one (Phase 10). */
  function markAsKeyAchievement(index: number, checked: boolean) {
    achievements.forEach((_, i) => {
      setValue(
        `achievements.${i}.is_key_achievement`,
        checked && i === index,
        { shouldDirty: true, shouldValidate: true }
      );
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Achievements and highlights</CardTitle>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              description: "",
              is_key_achievement: false,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add achievement
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <p className="py-6 text-center text-sm text-subtle">
            No achievements recorded yet.
          </p>
        ) : (
          <>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3">
                <div className="flex-1">
                  <Textarea
                    rows={2}
                    placeholder="What went well this week?"
                    {...register(`achievements.${index}.description`)}
                  />

                  {errors.achievements?.[index]?.description && (
                    <p className="mt-1 text-xs text-status-late">
                      {errors.achievements[index]?.description?.message}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <Checkbox
                      id={`achievement-key-${field.id}`}
                      checked={
                        achievements[index]?.is_key_achievement ?? false
                      }
                      onCheckedChange={(checked) =>
                        markAsKeyAchievement(index, checked === true)
                      }
                    />

                    <Label
                      htmlFor={`achievement-key-${field.id}`}
                      className="text-xs font-normal text-subtle"
                    >
                      Key achievement
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
                  <span className="sr-only">Remove achievement</span>
                </Button>
              </div>
            ))}

            {errors.achievements?.root && (
              <p className="text-sm text-status-late">
                {errors.achievements.root.message}
              </p>
            )}

            {typeof errors.achievements?.message === "string" && (
              <p className="text-sm text-status-late">
                {errors.achievements.message}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
