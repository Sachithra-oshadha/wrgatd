"use client";

import { ChartCard } from "./chart-card";
import { chartTheme } from "./chart-theme";
import type { MemberSubmission } from "@/lib/types";


const ORDER = [
  "APPROVED",
  "SUBMITTED",
  "NEEDS_CORRECTION",
  "DRAFT",
  "LATE",
  "NOT_STARTED",
] as const;

const LABELS: Record<string, string> = {
  APPROVED: "Approved",
  SUBMITTED: "Submitted",
  NEEDS_CORRECTION: "Needs correction",
  DRAFT: "Draft",
  LATE: "Late",
  NOT_STARTED: "Not started",
};


export function StatusDistribution({
  submissions,
  isLoading,
}: {
  submissions: MemberSubmission[];
  isLoading?: boolean;
}) {
  const counts = ORDER.map((status) => ({
    status,
    label: LABELS[status],
    color: chartTheme.status[status],
    count: submissions.filter((item) => item.status === status).length,
  })).filter((entry) => entry.count > 0);

  const total = submissions.length;

  return (
    <ChartCard
      title="Submission status"
      description="Every active team member, this week"
      isLoading={isLoading}
      isEmpty={total === 0}
      emptyMessage="No team members to report on."
    >
      <div className="flex h-full flex-col justify-center gap-6">

        <div className="flex h-6 w-full gap-0.5 overflow-hidden rounded-md">
          {counts.map((entry) => (
            <div
              key={entry.status}
              style={{
                width: `${(entry.count / total) * 100}%`,
                backgroundColor: entry.color,
              }}
              title={`${entry.label}: ${entry.count}`}
            />
          ))}
        </div>

        <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {counts.map((entry) => (
            <li
              key={entry.status}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-2 text-body">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden="true"
                />
                {entry.label}
              </span>

              <span className="font-medium text-heading">
                {entry.count}
              </span>
            </li>
          ))}
        </ul>

      </div>
    </ChartCard>
  );
}
