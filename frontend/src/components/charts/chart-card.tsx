import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ChartCard({
  title,
  description,
  isLoading,
  isEmpty,
  emptyMessage = "No data for this period.",
  children,
}: {
  title: string;
  description?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>

        {description && (
          <p className="text-sm text-subtle">{description}</p>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isEmpty ? (
          <div className="flex h-64 items-center justify-center text-sm text-subtle">
            {emptyMessage}
          </div>
        ) : (
          <div className="h-64 w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}
