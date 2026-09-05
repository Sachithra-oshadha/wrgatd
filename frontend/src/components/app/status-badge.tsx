import { cn } from "@/lib/utils";
import type { ReportStatus } from "@/lib/types";

export type BadgeStatus = ReportStatus | "NOT_STARTED" | "LATE";

const STYLES: Record<BadgeStatus, { label: string; className: string }> = {
  APPROVED: {
    label: "Approved",
    className: "bg-status-approved/10 text-status-approved ring-status-approved/25",
  },
  SUBMITTED: {
    label: "Submitted",
    className: "bg-status-submitted/10 text-status-submitted ring-status-submitted/25",
  },
  NEEDS_CORRECTION: {
    label: "Needs Correction",
    className: "bg-status-correction/10 text-status-correction ring-status-correction/25",
  },
  DRAFT: {
    label: "Draft",
    className: "bg-status-draft/10 text-status-draft ring-status-draft/25",
  },
  NOT_STARTED: {
    label: "Not Started",
    className: "bg-status-not-started/10 text-status-not-started ring-status-not-started/30",
  },
  LATE: {
    label: "Late",
    className: "bg-status-late/10 text-status-late ring-status-late/25",
  },
};


export function StatusBadge({
  status,
  className,
}: {
  status: BadgeStatus;
  className?: string;
}) {
  const style = STYLES[status];

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
