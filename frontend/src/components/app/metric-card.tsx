import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "approved" | "correction" | "late";
  icon?: LucideIcon;
}) {
  const style = {
    default: { text: "text-primary", bar: "bg-primary", chip: "bg-primary/10" },
    approved: {
      text: "text-status-approved",
      bar: "bg-status-approved",
      chip: "bg-status-approved/10",
    },
    correction: {
      text: "text-status-correction",
      bar: "bg-status-correction",
      chip: "bg-status-correction/10",
    },
    late: {
      text: "text-status-late",
      bar: "bg-status-late",
      chip: "bg-status-late/10",
    },
  }[tone];

  return (
    <Card className="relative overflow-hidden">
      <span className={cn("absolute inset-x-0 top-0 h-1", style.bar)} />

      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-3xl font-bold tabular-nums text-heading">
            {value}
          </p>

          {Icon && (
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                style.chip
              )}
            >
              <Icon className={cn("h-4.5 w-4.5", style.text)} />
            </span>
          )}
        </div>

        <p className="mt-1 text-sm font-medium text-body">{label}</p>

        {hint && <p className="mt-0.5 text-xs text-subtle">{hint}</p>}
      </CardContent>
    </Card>
  );
}