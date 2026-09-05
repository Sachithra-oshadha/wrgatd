import { z } from "zod";

const priority = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

const taskStatus = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
]);

/**
 * An optional numeric field.
 *
 * The empty-string-to-null conversion happens in the input's register()
 * options (see optionalNumberField in @/lib/forms), NOT here as a Zod
 * transform. A transform would make the schema's input type differ from
 * its output type, which breaks useForm<ReportFormValues>.
 */
const optionalNumber = (min: number, max: number, label: string) =>
  z
    .number()
    .min(min, `${label} must be between ${min} and ${max}`)
    .max(max, `${label} must be between ${min} and ${max}`)
    .nullable();


export const taskSchema = z.object({
  task_name: z.string().trim().min(1, "Task name is required").max(255),
  priority,
  planned_percent: optionalNumber(0, 100, "Planned %"),
  actual_percent: optionalNumber(0, 100, "Actual %"),
  status: taskStatus,
  time_planned: optionalNumber(0, 999, "Planned hours"),
  time_spent: optionalNumber(0, 999, "Hours spent"),
  deliverable: z.string().trim().max(2000).optional(),
});

export const nextWeekTaskSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(2000),
  priority,
});

export const blockerSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(2000),
  is_key_issue: z.boolean(),
});

export const achievementSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(2000),
  is_key_achievement: z.boolean(),
});

export const hoursSchema = z.object({
  task_type: z.string().trim().min(1, "Category is required").max(100),
  hours: z
    .number({ error: "Enter the hours worked" })
    .min(0, "Hours cannot be negative")
    .max(168, "That is more hours than a week contains"),
});


export const reportFormSchema = z
  .object({
    project_id: z.number().int().positive("Select a project"),
    week_start: z.string().min(1, "Select a week"),
    week_end: z.string().min(1),
    notes: z.string().trim().max(5000).optional(),
    links: z.string().trim().max(2000).optional(),
    tasks: z.array(taskSchema).max(50),
    next_week_tasks: z.array(nextWeekTaskSchema).max(50),
    blockers: z.array(blockerSchema).max(20),
    achievements: z.array(achievementSchema).max(20),
    hours: z.array(hoursSchema).max(20),
  })
  .refine(
    (values) =>
      values.blockers.filter((item) => item.is_key_issue).length <= 1,
    {
      message: "Only one blocker can be marked as the key issue",
      path: ["blockers"],
    }
  )
  .refine(
    (values) =>
      values.achievements.filter((item) => item.is_key_achievement)
        .length <= 1,
    {
      message: "Only one achievement can be marked as the key achievement",
      path: ["achievements"],
    }
  )
  .refine(
    (values) => {
      const categories = values.hours.map((item) =>
        item.task_type.trim().toLowerCase()
      );
      return new Set(categories).size === categories.length;
    },
    {
      message: "Each hours category can only appear once",
      path: ["hours"],
    }
  );

export type ReportFormValues = z.infer<typeof reportFormSchema>;

export type TaskValues = z.infer<typeof taskSchema>;
export type NextWeekTaskValues = z.infer<typeof nextWeekTaskSchema>;
export type BlockerValues = z.infer<typeof blockerSchema>;
export type AchievementValues = z.infer<typeof achievementSchema>;
export type HoursValues = z.infer<typeof hoursSchema>;
