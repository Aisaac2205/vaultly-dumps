import { Badge, BadgeDot } from "@/shared/ui/badge";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";

interface ConnectionStateBadgeProps {
  isActive: boolean;
  className?: string;
}

export function ConnectionStateBadge({
  isActive,
  className,
}: ConnectionStateBadgeProps) {
  const { t } = useTranslation("common");
  return (
    <Badge
      variant="outline"
      className={cn(isActive ? "text-text-secondary" : "text-muted-foreground", className)}
    >
      <BadgeDot tone={isActive ? "success" : "neutral"} />
      {isActive ? t("connection.active") : t("connection.inactive")}
    </Badge>
  );
}
