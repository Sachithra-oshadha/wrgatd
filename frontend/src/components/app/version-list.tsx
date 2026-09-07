"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportView } from "@/components/app/report-view";
import { fullName } from "@/lib/types";
import { useVersionHistory } from "@/hooks/use-reports";


export function VersionList({ reportId }: { reportId: number }) {
  const { data, isPending } = useVersionHistory(reportId);
  const [expanded, setExpanded] = useState<number | null>(null);

  if (isPending) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!data || data.versions.length === 0) {
    return null;
  }

  // newest first, matching the Phase 31 sketch
  const versions = [...data.versions].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Version history</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {versions.map((version) => {
          const isOpen = expanded === version.version_number;

          return (
            <div
              key={version.version_id}
              className="overflow-hidden rounded-md border"
            >
              <button
                type="button"
                onClick={() =>
                  setExpanded(isOpen ? null : version.version_number)
                }
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted"
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
                ) : (
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
                )}

                <div className="flex-1">
                  <p className="text-sm font-medium text-body">
                    Version {version.version_number}

                    {version.is_current && (
                      <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-normal text-accent-foreground">
                        Current
                      </span>
                    )}
                  </p>

                  <p className="mt-0.5 text-xs text-subtle">
                    {version.submitted_at
                      ? `Submitted ${format(parseISO(version.submitted_at), "MMM d, yyyy HH:mm")}`
                      : "Not yet submitted"}
                  </p>

                  {version.review && (
                    <div className="mt-2 rounded-md bg-muted p-3">
                      <p
                        className={cn(
                          "text-xs font-medium",
                          version.review.action === "APPROVED"
                            ? "text-status-approved"
                            : "text-status-correction"
                        )}
                      >
                        {version.review.action === "APPROVED"
                          ? "Approved"
                          : "Changes requested"}
                        {" by "}
                        {fullName(version.review.reviewer)}
                      </p>

                      {version.review.comment && (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-body">
                          {version.review.comment}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="border-t bg-background p-4">
                  <ReportView version={version} />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
