import { Card, CardContent, type CardProps } from "@/shared/ui/card";
import { Badge, BadgeDot } from "@/shared/ui/badge";
import { type ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: { value: number; positive: boolean };
  /**
   * Optional content rendered to the right of the value+trend group.
   * Useful for inline decorations like a Sparkline that should sit
   * horizontally next to the metric without changing card height.
   */
  aside?: ReactNode;
  statusColor?: string;
  loading?: boolean;
  compact?: boolean;
  variant?: CardProps["variant"];
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  aside,
  statusColor,
  compact = false,
  variant,
}: StatCardProps) {
  return (
    <Card variant={variant}>
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
          {aside && <div className="ml-auto shrink-0">{aside}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
