import { DataTable } from "@/shared/ui/data-table";
import { ConnectionLabel } from "@/shared/components/ConnectionLabel";
import { StatusBadge } from "@/shared/ui/status-badge";
import { shortId, formatDate, formatSize } from "../lib/format";
import type { BackupJob } from "../types";
import type { Column } from "@/shared/ui/data-table";

interface BackupTimelineProps {
  backups: BackupJob[];
  maxItems?: number;
}

export function BackupTimeline({ backups, maxItems = 15 }: BackupTimelineProps) {
  const visible = maxItems > 0 ? backups.slice(0, maxItems) : backups;
  const remaining = maxItems > 0 ? Math.max(0, backups.length - maxItems) : 0;

  const columns: Column<BackupJob>[] = [
    {
      header: "ID",
      accessor: (job) => (
        <span className="font-mono text-xs">{shortId(job.id)}</span>
      ),
      className: "w-20",
    },
    {
      header: "Conexión",
      accessor: (job) => (
        <ConnectionLabel
          id={job.connectionId}
          name={job.connectionName}
        />
      ),
    },
    {
      header: "Entorno",
      accessor: (job) => (
        <span className="text-muted-foreground font-mono text-xs uppercase">{job.environment}</span>
      ),
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
    },
    {
      header: "Estado",
      accessor: (job) => <StatusBadge status={job.status} />,
    },
    {
      header: "Fecha",
      accessor: (job) => (
        <span className="font-mono text-xs whitespace-nowrap">{formatDate(job.createdAt)}</span>
      ),
      className: "w-28",
    },
    {
      header: "Tamaño",
      accessor: (job) =>
        job.fileSizeMb != null
          ? formatSize(job.fileSizeMb * 1024 * 1024)
          : "—",
      className: "w-20",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-3 text-base font-semibold">Últimos Backups</h2>
      <div className="flex-1 rounded-lg bg-card shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={visible}
          emptyMessage="No hay backups recientes"
          className=""
        />
        {remaining > 0 && (
          <p className="py-2.5 text-center text-xs text-muted-foreground">
            +{remaining} más
          </p>
        )}
      </div>
    </div>
  );
}
