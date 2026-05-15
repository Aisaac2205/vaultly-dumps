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
      <p className="truncate font-medium text-sm" title={job.connectionName}>
        {job.connectionName}
      </p>
    ),
    className: "w-[24%] align-middle",
    headerClassName: "w-[24%] text-left",
  },

  {
    header: "Fecha",
    accessor: (job) => (
      <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(job.createdAt)}
      </span>
    ),
    className: "w-[14%] text-center align-middle",
    headerClassName: "w-[14%] text-center",
  },

  {
    header: "Origen",
    accessor: (job) => (
      <span className="text-xs text-muted-foreground">
        {job.triggeredBy === "system-cronjob" ? "Cronjob" : "Manual"}
      </span>
    ),
    className: "w-[11%] text-center align-middle",
    headerClassName: "w-[11%] text-center",
  },

  {
    header: "Estado",
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
    className: "w-[20%] text-center align-middle",
    headerClassName: "w-[20%] text-center",
  },

  {
    header: "Storage",
    accessor: () => (
      <div className="flex items-center justify-center">
        <img
          src={cloudflareSvg}
          alt="Cloudflare R2"
          className="h-4 w-4 shrink-0"
        />
      </div>
    ),
    className: "w-[8%] text-center align-middle",
    headerClassName: "w-[8%] text-center",
  },

  {
    header: "Tamaño",
    accessor: (job) => (
      <span className="font-mono text-xs text-muted-foreground">
        {job.fileSizeMb != null
          ? formatSize(job.fileSizeMb * 1024 * 1024)
          : "—"}
      </span>
    ),
    className: "w-[10%] text-center align-middle",
    headerClassName: "w-[10%] text-center",
  },

  {
    header: "Acciones",
    accessor: (job) => (
      <div className="flex items-center justify-center">
        <DumpActions job={job} />
      </div>
    ),
    className: "w-[13%] text-center align-middle",
    headerClassName: "w-[13%] text-center",
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
