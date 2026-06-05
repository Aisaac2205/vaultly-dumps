import { Badge, BadgeDot } from "@/shared/ui/badge";
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
      variant="outline"
      className={cn(isActive ? "text-text-secondary" : "text-muted-foreground", className)}
    >
      <BadgeDot tone={isActive ? "success" : "neutral"} />
      {isActive ? "Activa" : "Inactiva"}
    </Badge>
  );
}
