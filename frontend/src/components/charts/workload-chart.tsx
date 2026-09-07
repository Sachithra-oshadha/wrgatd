"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "./chart-card";
import { axisProps, chartTheme, tooltipStyle } from "./chart-theme";
import { useWorkload } from "@/hooks/use-dashboard";


export function WorkloadChart({ weekStart }: { weekStart?: string }) {
  const { data, isPending } = useWorkload({ week_start: weekStart });

  return (
    <ChartCard
      title="Workload by project"
      description="Hours logged this week"
      isLoading={isPending}
      isEmpty={!data || data.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 40, bottom: 0, left: 8 }}
        >
          <CartesianGrid
            horizontal={false}
            stroke={chartTheme.grid}
          />

          <XAxis type="number" {...axisProps} />

          <YAxis
            type="category"
            dataKey="project"
            width={110}
            {...axisProps}
          />

          <Tooltip
            {...tooltipStyle}
            formatter={(value) => [`${value}h`, "Hours"]}
          />

          <Bar
            dataKey="hours"
            fill={chartTheme.brand}
            radius={[0, 4, 4, 0]}
            barSize={18}
          >
            <LabelList
              dataKey="hours"
              position="right"
              formatter={(value) => `${value}h`}
              fill={chartTheme.text}
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
