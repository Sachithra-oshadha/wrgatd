import { cn } from "@/lib/utils";
import { spectrumColor } from "@/lib/color-hash";

export function ProjectBadge({
  name,
  isActive = true,
  className,
}: {
  name: string;
  isActive?: boolean;
  className?: string;
}) {
  const color = spectrumColor(name);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        isActive ? color.bg : "bg-muted",
        isActive ? "text-body" : "text-faint line-through",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          isActive ? color.dot : "bg-faint"
        )}
      />

      {name}
    </span>
  );
}
