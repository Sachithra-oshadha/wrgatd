"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { fullName } from "@/lib/types";
import type { ReviewComment } from "@/lib/types";


export function CorrectionBanner({
  reportId,
  review,
  showEditButton = true,
}: {
  reportId: number;
  review: ReviewComment | null;
  showEditButton?: boolean;
}) {
  return (
    <div className="mb-6 rounded-lg border-l-4 border-status-correction bg-status-correction/5 p-5">

      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-status-correction" />

        <div className="flex-1">
          <h2 className="font-semibold text-status-correction">
            Needs correction
          </h2>

          {review ? (
            <>
              <p className="mt-2 whitespace-pre-wrap text-sm text-body">
                {review.comment}
              </p>

              <p className="mt-3 text-xs text-subtle">
                Reviewed by {fullName(review.reviewer)} · version{" "}
                {review.version_number} ·{" "}
                {formatDistanceToNow(parseISO(review.created_at), {
                  addSuffix: true,
                })}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-subtle">
              Your manager asked for changes to this report.
            </p>
          )}
        </div>

        {showEditButton && (
          <Button asChild size="sm">
            <Link href={`/reports/${reportId}/edit`}>Edit report</Link>
          </Button>
        )}
      </div>

    </div>
  );
}
