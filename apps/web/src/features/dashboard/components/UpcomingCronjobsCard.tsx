import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Clock,
  Calendar,
  AlertCircle,
  PauseCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatUpcomingTime, formatDateTime } from "@/lib/format";
import type { CronjobEntity } from "../types";

interface UpcomingCronjobsCardProps {
  cronjobs: CronjobEntity[];
}

export function UpcomingCronjobsCard({ cronjobs }: UpcomingCronjobsCardProps) {
  const { t } = useTranslation('dashboard')
  const active = cronjobs.filter((c) => c.isActive);
  const paused = cronjobs.filter((c) => !c.isActive);

  // Order by nextRunAt ascending; nulls go last.
  const sortedActive = [...active].sort((a, b) => {
    if (!a.nextRunAt) return 1;
    if (!b.nextRunAt) return -1;
    return new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime();
  });

  const upcoming = sortedActive.slice(0, 3);
  const remaining = sortedActive.length - upcoming.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          {t('upcoming.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <div
            role="status"
            className="flex flex-col items-center gap-2 py-4 text-center text-sm text-muted-foreground"
          >
            <Clock className="h-8 w-8" aria-hidden="true" />
            <p>{t('upcoming.empty')}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((cj) => {
              const hasSchedule = cj.nextRunAt !== null;
              const absoluteTitle = hasSchedule
                ? formatDateTime(cj.nextRunAt as string)
                : undefined;
              return (
                <li
                  key={cj.id}
                  className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium" title={cj.name}>
                      {cj.name}
                    </p>
                    {hasSchedule ? (
                      <p
                        className="font-mono text-xs text-muted-foreground tabular-nums"
                        title={absoluteTitle}
                      >
                        {formatUpcomingTime(cj.nextRunAt as string)}
                      </p>
                    ) : (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertCircle
                          className="h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        {t('upcoming.noNext')}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {remaining > 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            +{remaining} más
          </p>
        )}
        {paused.length > 0 && (
          <p className="mt-1 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
            <PauseCircle className="h-3 w-3" aria-hidden="true" />
            {t(paused.length === 1 ? 'upcoming.paused_one' : 'upcoming.paused_other', { count: paused.length })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
