import { DataTable, type Column } from "@/shared/ui/data-table";
import { StatusBadge } from "@/shared/ui/status-badge";
import type { BackupJob } from "../types";
import { DumpActions } from "./DumpActions";
import { formatSize, formatDate } from "../lib/format";
import cloudflareSvg from "@/shared/assets/Cloudflare.svg";

interface DumpsTableProps {
  dumps: BackupJob[];
  isLoading: boolean;
  total: number;
}

const columns: Column<BackupJob>[] = [
  {
    header: "Conexión",
    accessor: (job) => (
      <div className="min-w-[240px]">
        <p className="truncate font-medium text-sm">
          {job.connectionName}
        </p>
      </div>
    ),
  },

  {
    header: "Fecha",
    accessor: (job) => (
      <div className="min-w-[150px]">
        <span className="font-mono text-xs text-muted-foreground">
          {formatDate(job.createdAt)}
        </span>
      </div>
    ),
  },

  {
    header: "Origen",
    accessor: (job) => (
      <div className="w-[80px]">
        <span className="text-xs text-muted-foreground">
          {job.triggeredBy === "system-cronjob" ? "Cronjob" : "Manual"}
        </span>
      </div>
    ),
  },

  {
    header: "Estado",
    accessor: (job) => (
      <div className="flex items-center min-w-[160px]">
        <StatusBadge status={job.status} />

        {job.status === "failed" && job.errorMessage && (
          <p className="ml-2 truncate text-xs font-mono text-error">
            {job.errorMessage}
          </p>
        )}
      </div>
    ),
  },

  {
    header: "Storage",
    accessor: () => (
      <div className="flex items-center justify-center w-[80px]">
        <img
          src={cloudflareSvg}
          alt="Cloudflare R2"
          className="h-4 w-4 shrink-0"
        />
      </div>
    ),
  },

  {
    header: "Tamaño",
    accessor: (job) => (
      <div className="w-[90px]">
        <span className="font-mono text-xs text-muted-foreground">
          {job.fileSizeMb != null
            ? formatSize(job.fileSizeMb * 1024 * 1024)
            : "—"}
        </span>
      </div>
    ),
  },

  {
    header: "Acciones",
    accessor: (job) => (
      <div className="flex justify-end w-[140px]">
        <DumpActions job={job} />
      </div>
    ),
  },
];

export function DumpsTable({ dumps, isLoading, total }: DumpsTableProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Mostrando {total} {total === 1 ? "registro" : "registros"}
      </p>
      <DataTable
        columns={columns}
        data={dumps}
        loading={isLoading}
        emptyMessage="No hay backups registrados"
      />
    </div>
  );
}
