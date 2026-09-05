import {
  addDays,
  addWeeks,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";

export function mondayOf(value: Date): Date {
  return startOfWeek(value, { weekStartsOn: 1 });
}

export function weekBounds(value: Date): [Date, Date] {
  const start = mondayOf(value);
  return [start, addDays(start, 6)];
}

export function currentWeekBounds(): [Date, Date] {
  return weekBounds(new Date());
}

export function shiftWeek(start: Date, delta: number): [Date, Date] {
  return weekBounds(addWeeks(start, delta));
}

export function toApiDate(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

export function formatWeekRange(
  start: string | Date,
  end: string | Date
): string {
  const from = typeof start === "string" ? parseISO(start) : start;
  const to = typeof end === "string" ? parseISO(end) : end;

  return `${format(from, "MMM d")} – ${format(to, "MMM d, yyyy")}`;
}
