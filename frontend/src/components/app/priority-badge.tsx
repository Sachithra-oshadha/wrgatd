import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/types";

const STYLES: Record<Priority, { label: string; className: string }> = {
  LOW: {
    label: "Low",
    className: "bg-priority-low/10 text-priority-low ring-priority-low/25",
  },
  MEDIUM: {
    label: "Medium",
    className:
      "bg-priority-medium/10 text-priority-medium ring-priority-medium/25",
  },
  HIGH: {
    label: "High",
    className: "bg-priority-high/10 text-priority-high ring-priority-high/25",
  },
  CRITICAL: {
    label: "Critical",
    className:
      "bg-priority-critical/10 text-priority-critical ring-priority-critical/25",
  },
};


export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const style = STYLES[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        style.className,
        className
      )}
    >
      {style.label}
    </span>
  );
}
