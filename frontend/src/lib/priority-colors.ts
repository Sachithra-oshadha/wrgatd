/**
 * Shared styling for editable native <select> priority pickers.
 *
 * The select's border/text colour tracks its current value via the
 * `data-priority` attribute rather than React state, so it updates
 * on every change without triggering a re-render of the parent row.
 */
export const PRIORITY_SELECT_CLASSES =
  "h-9 w-full rounded-md border bg-card px-2 text-sm font-medium " +
  "data-[priority=LOW]:border-priority-low data-[priority=LOW]:text-priority-low " +
  "data-[priority=MEDIUM]:border-priority-medium data-[priority=MEDIUM]:text-priority-medium " +
  "data-[priority=HIGH]:border-priority-high data-[priority=HIGH]:text-priority-high " +
  "data-[priority=CRITICAL]:border-priority-critical data-[priority=CRITICAL]:text-priority-critical";
