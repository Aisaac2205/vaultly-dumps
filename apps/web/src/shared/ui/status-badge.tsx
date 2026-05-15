import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "@/shared/ui/badge";

const statusBadgeVariants = cva("inline-flex items-center gap-1.5", {
  variants: {
    variant: {
      pending: "bg-warning-bg text-warning",
      running: "bg-info-bg text-info",
      completed: "bg-success-bg text-success",
      failed: "bg-error-bg text-error",
    },
  },
  defaultVariants: {
    variant: "pending",
  },
});

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: "pending" | "running" | "completed" | "failed";
}

function statusToVariant(
  status: StatusBadgeProps["status"],
): StatusBadgeProps["variant"] {
  return status;
}

const STATUS_LABELS: Record<StatusBadgeProps["status"], string> = {
  pending: "Pendiente",
  running: "En progreso",
  completed: "Completado",
  failed: "Fallido",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = statusToVariant(status);

  return (
    <Badge className={statusBadgeVariants({ variant })}>
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {STATUS_LABELS[status]}
    </Badge>
  );
}
