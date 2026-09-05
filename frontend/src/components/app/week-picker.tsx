"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  formatWeekRange,
  shiftWeek,
  toApiDate,
} from "@/lib/weeks";


export function WeekPicker({
  weekStart,
  weekEnd,
  onChange,
  disabled = false,
}: {
  weekStart: string;
  weekEnd: string;
  onChange: (start: string, end: string) => void;
  disabled?: boolean;
}) {
  function move(delta: number) {
    const [start, end] = shiftWeek(parseISO(weekStart), delta);
    onChange(toApiDate(start), toApiDate(end));
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled}
        onClick={() => move(-1)}
        aria-label="Previous week"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="min-w-52 rounded-md border bg-card px-4 py-2 text-center text-sm font-medium text-body">
        {formatWeekRange(weekStart, weekEnd)}
      </span>

      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled}
        onClick={() => move(1)}
        aria-label="Next week"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
