import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star } from "lucide-react";

import { PriorityBadge } from "@/components/app/priority-badge";
import { TASK_STATUSES } from "@/lib/constants";
import type {
  NextWeekTask,
  ReportAchievement,
  ReportBlocker,
  ReportHours,
  ReportTask,
} from "@/lib/types";


interface VersionContent {
  tasks: ReportTask[];
  next_week_tasks: NextWeekTask[];
  blockers: ReportBlocker[];
  achievements: ReportAchievement[];
  hours: ReportHours[];
}

function label(
  options: { value: string; label: string }[],
  value: string
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function percent(value: string | null): string {
  return value === null ? "—" : `${Number(value)}%`;
}

function spent(value: string | null): string {
  return value === null ? "—" : `${Number(value)}h`;
}

export function ReportView({ version }: { version: VersionContent }) {
  const totalHours = version.hours.reduce(
    (sum, entry) => sum + Number(entry.hours),
    0
  );

  return (
    <div className="space-y-6">

      <Card>
        <CardHeader>
          <CardTitle>Tasks completed</CardTitle>
        </CardHeader>

        <CardContent>
          {version.tasks.length === 0 ? (
            <p className="text-sm text-subtle">No tasks recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead className="w-24">Priority</TableHead>
                    <TableHead className="w-24">Planned</TableHead>
                    <TableHead className="w-24">Actual</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-24">Spent</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {version.tasks.map((task) => (
                    <TableRow key={task.task_id}>
                      <TableCell>
                        <p className="font-medium text-body">
                          {task.task_name}
                        </p>

                        {task.deliverable && (
                          <p className="mt-0.5 text-xs text-subtle">
                            {task.deliverable}
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        <PriorityBadge priority={task.priority} />
                      </TableCell>

                      <TableCell className="text-subtle">
                        {percent(task.planned_percent)}
                      </TableCell>

                      <TableCell className="text-subtle">
                        {percent(task.actual_percent)}
                      </TableCell>

                      <TableCell className="text-subtle">
                        {label(TASK_STATUSES, task.status)}
                      </TableCell>

                      <TableCell className="text-subtle">
                        {spent(task.time_spent)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">

        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {version.achievements.length === 0 ? (
              <p className="text-sm text-subtle">None recorded.</p>
            ) : (
              version.achievements.map((item) => (
                <div
                  key={item.achievement_id}
                  className="flex items-start gap-2 text-sm text-body"
                >
                  {item.is_key_achievement && (
                    <Star className="mt-0.5 h-4 w-4 shrink-0 fill-status-approved text-status-approved" />
                  )}

                  <span>{item.description}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blockers</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {version.blockers.length === 0 ? (
              <p className="text-sm text-subtle">None recorded.</p>
            ) : (
              version.blockers.map((item) => (
                <div
                  key={item.blocker_id}
                  className="flex items-start gap-2 text-sm text-body"
                >
                  {item.is_key_issue && (
                    <Star className="mt-0.5 h-4 w-4 shrink-0 fill-status-correction text-status-correction" />
                  )}

                  <span>{item.description}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planned next week</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {version.next_week_tasks.length === 0 ? (
              <p className="text-sm text-subtle">Nothing planned.</p>
            ) : (
              version.next_week_tasks.map((item) => (
                <div
                  key={item.next_task_id}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <span className="text-body">{item.description}</span>

                  <PriorityBadge
                    priority={item.priority}
                    className="shrink-0"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hours worked</CardTitle>
          </CardHeader>

          <CardContent>
            {version.hours.length === 0 ? (
              <p className="text-sm text-subtle">No hours recorded.</p>
            ) : (
              <>
                {version.hours.map((entry) => (
                  <div
                    key={entry.hours_id}
                    className="flex justify-between border-b py-2 text-sm last:border-0"
                  >
                    <span className="text-body">{entry.task_type}</span>
                    <span className="text-subtle">
                      {Number(entry.hours)}h
                    </span>
                  </div>
                ))}

                <div className="flex justify-between pt-3 text-sm font-semibold">
                  <span className="text-heading">Total</span>
                  <span className="text-heading">{totalHours}h</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
