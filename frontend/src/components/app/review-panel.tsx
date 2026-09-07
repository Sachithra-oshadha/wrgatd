"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useReviewReport } from "@/hooks/use-reports";


export function ReviewPanel({ reportId }: { reportId: number }) {
  const router = useRouter();
  const review = useReviewReport();

  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");

  async function act(action: "approve" | "request-changes") {
    if (action === "request-changes" && !comment.trim()) {
      setCommentError(
        "Explain what needs to change so the author knows what to fix."
      );
      return;
    }

    setCommentError("");

    await review.mutateAsync({
      reportId,
      action,
      comment: comment.trim() || undefined,
    });

    router.push("/team");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="review-comment">Comment</Label>

          <Textarea
            id="review-comment"
            rows={4}
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              setCommentError("");
            }}
            placeholder="Required when requesting changes, optional when approving."
          />

          {commentError && (
            <p className="text-sm text-status-late">{commentError}</p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={review.isPending}
            onClick={() => act("request-changes")}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Request Changes
          </Button>

          <Button
            type="button"
            disabled={review.isPending}
            onClick={() => act("approve")}
          >
            <Check className="mr-2 h-4 w-4" />
            Approve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
