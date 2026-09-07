"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

import { ChartCard } from "./chart-card";
import { axisProps, chartTheme, tooltipStyle } from "./chart-theme";
import { useTasksTrend } from "@/hooks/use-dashboard";


export function TasksTrendChart({
  userId,
  projectId,
}: {
  userId?: number;
  projectId?: number;
}) {
  const { data, isPending } = useTasksTrend({
    weeks: 8,
    user_id: userId,
    project_id: projectId,
  });

  const points = (data ?? []).map((point) => ({
    week: format(parseISO(point.week_start), "MMM d"),
    tasks: point.completed_tasks,
  }));

  const hasData = points.some((point) => point.tasks > 0);

  return (
    <ChartCard
      title="Tasks completed"
      description="Completed tasks per week, last 8 weeks"
      isLoading={isPending}
      isEmpty={!hasData}
      emptyMessage="No completed tasks in the last 8 weeks."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
        >
          <CartesianGrid
            vertical={false}
            stroke={chartTheme.grid}
          />

          <XAxis dataKey="week" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} />

          <Tooltip
            {...tooltipStyle}
            formatter={(value) => [`${value} tasks`, ""]}
          />

          <Line
            type="monotone"
            dataKey="tasks"
            stroke={chartTheme.brand}
            strokeWidth={2}
            dot={{ r: 4, fill: chartTheme.brand, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
