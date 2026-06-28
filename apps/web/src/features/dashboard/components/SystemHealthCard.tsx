import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import type { R2Object } from "../types";
import { useTranslation } from "react-i18next";
import { formatRelativeTime } from "@/lib/format";
import { formatSize } from "@/shared/lib/format";
import cloudflareSvg from "@/shared/assets/Cloudflare.svg";
import { Activity, HardDrive } from "lucide-react";

interface SystemHealthCardProps {
  dumps: R2Object[];
}

export function SystemHealthCard({ dumps }: SystemHealthCardProps) {
  const { t } = useTranslation('dashboard')
  const totalSize = dumps.reduce((acc, d) => acc + d.size, 0);
  const lastDump =
    dumps.length > 0
      ? dumps.reduce((latest, d) =>
          new Date(d.lastModified) > new Date(latest.lastModified) ? d : latest,
        )
      : null;

  const hasStorage = dumps.length > 0;

  if (!hasStorage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('health.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Activity className="h-8 w-8" />}
            title={t('health.empty.title')}
            description={t('health.empty.description')}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          {t('health.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Section */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <HardDrive className="h-3.5 w-3.5" />
            {t('health.storage')}
            <img src={cloudflareSvg} alt="Cloudflare R2" className="h-3.5 w-3.5" />
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('health.dumpsStored')}</span>
              <span className="font-mono font-semibold">{dumps.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('health.spaceUsed')}</span>
              <span className="font-mono font-semibold">
                {totalSize > 0 ? formatSize(totalSize) : "0 MB"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('health.lastDump')}</span>
              <span className="font-mono text-xs">
                {lastDump ? formatRelativeTime(lastDump.lastModified) : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
