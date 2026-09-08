"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { StatusBadge } from "@/components/app/status-badge";
import { PriorityBadge } from "@/components/app/priority-badge";
import { UserAvatar } from "@/components/app/user-avatar";

import { useTeamSections } from "@/hooks/use-dashboard";
import { TASK_STATUSES } from "@/lib/constants";
import type { SectionType } from "@/lib/types";


const SECTION_OPTIONS: { value: SectionType; label: string }[] = [
  { value: "blockers", label: "Blockers" },
  { value: "achievements", label: "Achievements" },
  { value: "next_week_tasks", label: "Planned next week" },
  { value: "tasks", label: "Tasks completed" },
];

function taskStatusLabel(value: string): string {
  return TASK_STATUSES.find((option) => option.value === value)?.label ?? value;
}


export function TeamSectionView({
  weekStart,
  projectId,
  userId,
}: {
  weekStart: string;
  projectId?: number;
  userId?: number;
}) {
  const [section, setSection] = useState<SectionType>("blockers");

  const { data, isPending } = useTeamSections({
    week_start: weekStart,
    project_id: projectId,
    section,
  });

  const members = userId
    ? (data ?? []).filter((member) => member.user_id === userId)
    : data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Compare across the team
        </CardTitle>

        <select
          value={section}
          onChange={(event) => setSection(event.target.value as SectionType)}
          className="h-9 rounded-md border bg-card px-3 text-sm"
          aria-label="Section to compare"
        >
          {SECTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </CardHeader>

      <CardContent>
        {isPending ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="rounded-lg border bg-card p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={member} />
                    <span className="font-medium text-body">
                      {member.first_name} {member.last_name}
                    </span>
                  </div>

                  <StatusBadge status={member.status} />
                </div>

                {member.report_id === null ? (
                  <p className="text-sm text-subtle">
                    No report for this week.
                  </p>
                ) : member.items.length === 0 ? (
                  <p className="text-sm text-subtle">None recorded.</p>
                ) : (
                  <ul className="space-y-2">
                    {member.items.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start justify-between gap-2 text-sm"
                      >
                        <span className="flex items-start gap-1.5 text-body">
                          {item.is_key && (
                            <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-status-approved text-status-approved" />
                          )}
                          {item.description}
                        </span>

                        <span className="flex shrink-0 items-center gap-1.5">
                          {item.status && (
                            <span className="text-xs text-subtle">
                              {taskStatusLabel(item.status)}
                            </span>
                          )}

                          {item.priority && (
                            <PriorityBadge priority={item.priority} />
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
