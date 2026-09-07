import { cn } from "@/lib/utils";
import { spectrumColor } from "@/lib/color-hash";
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

  const color = spectrumColor(`${user.first_name} ${user.last_name}`);

  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        color.bg,
        color.text,
        className
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
