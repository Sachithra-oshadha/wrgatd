import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "approved" | "correction" | "late";
}) {
  const toneClass = {
    default: "text-heading",
    approved: "text-status-approved",
    correction: "text-status-correction",
    late: "text-status-late",
  }[tone];

  return (
    <Card>
      <CardContent className="p-5">
        <p className={cn("text-3xl font-bold tabular-nums", toneClass)}>
          {value}
        </p>

        <p className="mt-1 text-sm font-medium text-body">{label}</p>

        {hint && <p className="mt-0.5 text-xs text-subtle">{hint}</p>}
      </CardContent>
    </Card>
  );
}
