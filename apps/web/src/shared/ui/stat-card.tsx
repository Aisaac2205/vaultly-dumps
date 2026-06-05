import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { type ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: { value: number; positive: boolean };
  statusColor?: string;
  loading?: boolean;
  compact?: boolean;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  statusColor,
  loading,
  compact = false,
}: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="mb-3.5 h-3.5 w-24" />
          <Skeleton className={compact ? "h-7 w-16" : "h-9 w-24"} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground/70">{icon}</span>}
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <p
            className={`truncate font-semibold leading-none tracking-tight tabular-nums text-text-primary ${
              compact ? "text-2xl" : "text-3xl"
            }`}
            style={statusColor ? { color: statusColor } : undefined}
          >
            {value}
          </p>
          {trend && (
            <span
              className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums ${
                trend.positive ? "bg-success-bg text-success" : "bg-error-bg text-error"
              }`}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
