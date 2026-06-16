import { formatRelativeTime } from "../lib/format";

interface AutoRefreshIndicatorProps {
  lastUpdated: Date | null;
}

export function AutoRefreshIndicator({
  lastUpdated,
}: AutoRefreshIndicatorProps) {
  if (!lastUpdated) return null;

  return (
    <p
      role="status"
      aria-live="polite"
      className="text-xs text-muted-foreground tabular-nums"
    >
      Actualizado {formatRelativeTime(lastUpdated.toISOString())}
    </p>
  );
}
