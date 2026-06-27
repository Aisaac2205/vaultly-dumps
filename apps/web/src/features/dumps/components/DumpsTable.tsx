import { DataTable, type Column } from "@/shared/ui/data-table";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Database } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BackupJob } from "../types";
import { DumpActions } from "./DumpActions";
import { formatSize } from "@/shared/lib/format";
import { formatDateTimeShort as formatDate } from "@/lib/format";
import cloudflareSvg from "@/shared/assets/Cloudflare.svg";

interface DumpsTableProps {
  dumps: BackupJob[];
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  /** Rendered in the pagination slot below the table. */
  pagination?: React.ReactNode;
}

export function DumpsTable({
  dumps,
  isLoading,
  total,
  page,
  pageSize,
  pagination,
}: DumpsTableProps) {
  const { t } = useTranslation('dumps')
  const start = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);

  const columns: Column<BackupJob>[] = [
    {
      header: t('column.connection'),
      accessor: (job) => (
        <p className="truncate font-medium text-sm" title={job.connectionName}>
          {job.connectionName}
        </p>
      ),
      className: "w-[20%]",
      headerClassName: "w-[20%]",
    },
    {
      header: t('column.environment'),
      accessor: (job) => (
        <span className="text-xs text-muted-foreground">{job.environment}</span>
      ),
      className: "w-[8%]",
      headerClassName: "w-[8%]",
    },
    {
      header: t('column.date'),
      accessor: (job) => (
        <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(job.createdAt)}
        </span>
      ),
      className: "w-[14%] hidden sm:table-cell",
      headerClassName: "w-[14%] hidden sm:table-cell",
    },
    {
      header: t('column.origin'),
      accessor: (job) => (
        <span className="text-xs text-muted-foreground">
          {job.triggeredBy === "system-cronjob" ? t('origin.cronjob') : t('origin.manual')}
        </span>
      ),
      className: "w-[11%] hidden sm:table-cell",
      headerClassName: "w-[11%] hidden sm:table-cell",
    },
    {
      header: t('column.status'),
      accessor: (job) => (
        <div className="flex flex-col items-center gap-1">
          <StatusBadge status={job.status} />
          {job.status === "failed" && job.errorMessage && (
            <p
              className="max-w-full truncate text-[10px] font-mono text-error"
              title={job.errorMessage}
            >
              {job.errorMessage}
            </p>
          )}
        </div>
      ),
      className: "w-[20%]",
      headerClassName: "w-[20%]",
    },
    {
      header: t('column.storage'),
      accessor: () => (
        <div className="flex items-center justify-center">
          <img
            src={cloudflareSvg}
            alt="Cloudflare R2"
            className="h-4 w-4 shrink-0"
          />
        </div>
      ),
      className: "w-[8%] hidden sm:table-cell",
      headerClassName: "w-[8%] hidden sm:table-cell",
    },
    {
      header: t('column.size'),
      accessor: (job) => (
        <span className="font-mono text-xs text-muted-foreground">
          {job.fileSizeMb != null
            ? formatSize(job.fileSizeMb * 1024 * 1024)
            : "—"}
        </span>
      ),
      className: "w-[8%] hidden sm:table-cell",
      headerClassName: "w-[8%] hidden sm:table-cell",
    },
    {
      header: t('column.actions'),
      accessor: (job) => (
        <div className="flex items-center justify-center">
          <DumpActions job={job} />
        </div>
      ),
      className: "w-[11%]",
      headerClassName: "w-[11%]",
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {total > 0
          ? `${t('label.showing', { start, end, total, item: total === 1 ? t('label.record', { ns: 'common' }) : t('label.records', { ns: 'common' }) })}`
          : t('label.noRecords')}
      </p>
      {dumps.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Database className="h-8 w-8 mb-3 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">
            {t('empty.noResults.title')}
          </p>
          <p className="text-xs mt-1">
            {t('empty.noResults.description')}
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={dumps}
          loading={isLoading}
          emptyMessage={t('empty.noBackups')}
          pagination={pagination}
        />
      )}
    </div>
  );
}
