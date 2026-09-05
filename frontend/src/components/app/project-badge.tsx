import { cn } from "@/lib/utils";

export function ProjectBadge({
  name,
  isActive = true,
  className,
}: {
  name: string;
  isActive?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium",
        isActive ? "text-body" : "text-faint line-through",
        className
      )}
    >
      {name}
    </span>
  );
}
