import { Badge, BadgeDot, type BadgeDotTone } from "@/shared/ui/badge";

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

const STATUS_LABELS: Record<Status, string> = {
  pending: "Pendiente",
  running: "En progreso",
  completed: "Completado",
  failed: "Fallido",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className="text-text-secondary">
      <BadgeDot tone={STATUS_TONE[status]} pulse={status === "running"} />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
