import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-16 text-center">
      <Icon className="mb-3 h-8 w-8 text-faint" />

      <p className="font-medium text-body">{title}</p>

      {description && (
        <p className="mt-1 max-w-sm text-sm text-subtle">{description}</p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
