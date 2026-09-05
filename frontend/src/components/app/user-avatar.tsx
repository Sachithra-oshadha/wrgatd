import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";


export function UserAvatar({
  user,
  className,
}: {
  user: Pick<User, "first_name" | "last_name">;
  className?: string;
}) {
  const initials =
    `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground",
        className
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
