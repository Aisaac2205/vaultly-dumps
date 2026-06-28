import { Badge, BadgeDot, type BadgeDotTone } from "@/shared/ui/badge";
import { useTranslation } from "react-i18next";

type Status = "pending" | "running" | "completed" | "failed";

interface StatusBadgeProps {
  status: Status;
}

const STATUS_TONE: Record<Status, BadgeDotTone> = {
  pending: "warning",
  running: "info",
  completed: "success",
  failed: "error",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation("common");
  return (
    <Badge variant="outline" className="text-text-secondary">
      <BadgeDot tone={STATUS_TONE[status]} pulse={status === "running"} />
      {t(`status.${status}`)}
    </Badge>
  );
}
