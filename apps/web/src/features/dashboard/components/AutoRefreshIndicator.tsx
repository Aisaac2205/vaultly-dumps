import { formatRelativeTime } from "@/lib/format";
import { useTranslation } from "react-i18next";

interface AutoRefreshIndicatorProps {
  lastUpdated: Date | null;
}

export function AutoRefreshIndicator({
  lastUpdated,
}: AutoRefreshIndicatorProps) {
  const { t } = useTranslation('dashboard')
  if (!lastUpdated) return null;

  return (
    <p
      role="status"
      aria-live="polite"
      className="text-xs text-muted-foreground tabular-nums"
    >
      {t('header.updated')} {formatRelativeTime(lastUpdated.toISOString())}
    </p>
  );
}
