import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Check, RotateCcw, Send } from "lucide-react";

import type { ActivityEvent } from "@/lib/types";


const CONFIG = {
  SUBMITTED: {
    icon: Send,
    className: "text-status-submitted",
    verb: "submitted a weekly report",
  },
  APPROVED: {
    icon: Check,
    className: "text-status-approved",
    verb: "approved a report",
  },
  REQUEST_CHANGES: {
    icon: RotateCcw,
    className: "text-status-correction",
    verb: "sent a report back for correction",
  },
} as const;


export function ActivityItem({ event }: { event: ActivityEvent }) {
  const config = CONFIG[event.kind];
  const Icon = config.icon;

  return (
    <Link
      href={`/reports/${event.report_id}`}
      className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted"
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.className}`} />

      <div className="min-w-0 flex-1">
        <p className="text-sm text-body">
          <span className="font-medium">{event.actor}</span> {config.verb}
        </p>

        <p className="text-xs text-subtle">
          {formatDistanceToNow(parseISO(event.at), { addSuffix: true })}
        </p>
      </div>
    </Link>
  );
}
