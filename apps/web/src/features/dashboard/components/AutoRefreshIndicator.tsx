import { RefreshCw } from "lucide-react";
import { formatRelativeTime } from "../lib/format";

interface AutoRefreshIndicatorProps {
  lastUpdated: Date | null;
}

export function AutoRefreshIndicator({
  lastUpdated,
}: AutoRefreshIndicatorProps) {
  if (!lastUpdated) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <RefreshCw className="h-3.5 w-3.5" />
      <span>Actualizado {formatRelativeTime(lastUpdated.toISOString())}</span>
    </div>
  );
}
