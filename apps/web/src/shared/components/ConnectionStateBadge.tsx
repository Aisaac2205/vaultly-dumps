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
        "inline-flex items-center gap-1.5 border",
        isActive
          ? "border-success/30 bg-success-bg text-success"
          : "border-border bg-muted text-muted-foreground",
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
