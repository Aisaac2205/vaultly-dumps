import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { DataTable } from "@/shared/ui/data-table";
import { StatusBadge } from "@/shared/ui/status-badge";
import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { shortId, formatDateTimeShort as formatDate } from "@/lib/format";
import type { RestoreJob } from "../types";
import type { Column } from "@/shared/ui/data-table";

const MAX_ITEMS = 7;

interface RestoreTimelineProps {
  restores: RestoreJob[];
}

export function RestoreTimeline({ restores }: RestoreTimelineProps) {
  const { t } = useTranslation('dashboard')
  const visible = restores.slice(0, MAX_ITEMS);
  const remaining = Math.max(0, restores.length - MAX_ITEMS);
  const hasRestores = restores.length > 0;

  const columns: Column<RestoreJob>[] = [
    {
      header: t('column.id'),
      accessor: (job) => (
        <span className="font-mono text-xs">{shortId(job.id)}</span>
      ),
      className: "w-20",
    },
    {
      header: t('column.environment'),
      accessor: (job) => job.targetEnvironment,
      className: "w-20",
    },
    {
      header: t('column.dryRun'),
      accessor: (job) => (job.isDryRun ? t('value.yes') : t('value.no')),
      className: "w-16 text-center",
      headerClassName: "text-center",
    },
    {
      header: t('column.status'),
      accessor: (job) => <StatusBadge status={job.status} />,
    },
    {
      header: t('column.date'),
      accessor: (job) => (
        <span className="font-mono text-xs whitespace-nowrap">{formatDate(job.createdAt)}</span>
      ),
      className: "w-28",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('timeline.restores.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasRestores ? (
          <>
            <DataTable columns={columns} data={visible} compact />
            {remaining > 0 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                +{remaining}
              </p>
            )}
          </>
        ) : (
          <EmptyState
            icon={<RotateCcw className="h-8 w-8" />}
            title={t('timeline.restores.empty.title')}
            description={t('timeline.restores.empty.description')}
          />
        )}
      </CardContent>
    </Card>
  );
}
