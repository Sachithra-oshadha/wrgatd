import type { Priority, TaskStatus } from "@/lib/types";

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "BLOCKED", label: "Blocked" },
];

export const HOUR_CATEGORIES = [
  "Development",
  "Testing",
  "Meetings",
  "Documentation",
  "Research",
  "Other",
] as const;
