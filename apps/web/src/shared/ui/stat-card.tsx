import { Card, CardContent } from "@/shared/ui/card";
import { Badge, BadgeDot } from "@/shared/ui/badge";
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
          {icon && <span className="text-muted-foreground">{icon}</span>}
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
            <Badge variant="outline" className="shrink-0">
              <BadgeDot tone={trend.positive ? "success" : "error"} />
              {trend.positive ? "↑" : "↓"} {trend.value}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
