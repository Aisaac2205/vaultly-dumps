import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { type ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
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
          <Skeleton className="mb-3 h-3 w-24" />
          <Skeleton className="h-7 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {icon && (
            <span className="text-muted-foreground">{icon}</span>
          )}
        </div>
        <p
          className={`mt-2 font-mono font-semibold ${compact ? "text-lg" : "text-2xl"}`}
          style={statusColor ? { color: statusColor } : undefined}
        >
          {value}
        </p>
        {trend && (
          <p
            className={`mt-1 text-xs font-medium ${
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
