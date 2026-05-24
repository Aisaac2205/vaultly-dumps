import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/cn";

interface ConnectionStateBadgeProps {
  isActive: boolean;
  className?: string;
}

export function ConnectionStateBadge({
  isActive,
  className,
}: ConnectionStateBadgeProps) {
  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5",
        isActive
          ? "bg-success-bg text-success"
          : "bg-muted text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          isActive ? "bg-success" : "bg-muted-foreground",
        )}
        aria-hidden="true"
      />
      {isActive ? "Activa" : "Inactiva"}
    </Badge>
  );
}
