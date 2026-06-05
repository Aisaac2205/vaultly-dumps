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
          <Skeleton className="mb-3.5 h-2.5 w-24" />
          <Skeleton className={compact ? "h-5 w-14" : "h-7 w-20"} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            {label}
          </p>
          {icon && (
            <span className="text-muted-foreground/70">{icon}</span>
          )}
        </div>
        <p
          className={`mt-2.5 truncate font-mono font-semibold leading-none tracking-tight tabular-nums ${
            compact ? "text-base" : "text-xl"
          }`}
          style={statusColor ? { color: statusColor } : undefined}
        >
          {value}
        </p>
        {trend && (
          <p
            className={`mt-2 text-xs font-medium tabular-nums ${
              trend.positive ? "text-success" : "text-error"
            }`}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}
