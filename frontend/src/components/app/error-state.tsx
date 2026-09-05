import { AlertTriangle } from "lucide-react";

import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";


export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const isForbidden = error instanceof ApiError && error.status === 403;

  const message = isForbidden
    ? "You do not have permission to view this."
    : error instanceof Error
      ? error.message
      : "Something went wrong.";

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-16 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-status-late" />

      <p className="font-medium text-body">{message}</p>

      {onRetry && !isForbidden && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
