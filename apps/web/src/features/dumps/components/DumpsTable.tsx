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
  page: number;
  pageSize: number;
  /** Rendered in the pagination slot below the table. */
  pagination?: React.ReactNode;
}

const columns: Column<BackupJob>[] = [
  {
    header: "Conexión",
    accessor: (job) => (
      <p className="truncate font-medium text-sm" title={job.connectionName}>
        {job.connectionName}
      </p>
    ),
    className: "w-[20%]",
    headerClassName: "w-[20%]",
  },

  {
    header: "Entorno",
    accessor: (job) => (
      <span className="text-xs text-muted-foreground">{job.environment}</span>
    ),
    className: "w-[8%]",
    headerClassName: "w-[8%]",
  },

  {
    header: "Fecha",
    accessor: (job) => (
      <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(job.createdAt)}
      </span>
    ),
    className: "w-[14%] hidden sm:table-cell",
    headerClassName: "w-[14%] hidden sm:table-cell",
  },

  {
    header: "Origen",
    accessor: (job) => (
      <span className="text-xs text-muted-foreground">
        {job.triggeredBy === "system-cronjob" ? "Cronjob" : "Manual"}
      </span>
    ),
    className: "w-[11%] hidden sm:table-cell",
    headerClassName: "w-[11%] hidden sm:table-cell",
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
    className: "w-[20%]",
    headerClassName: "w-[20%]",
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
    className: "w-[8%] hidden sm:table-cell",
    headerClassName: "w-[8%] hidden sm:table-cell",
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
    className: "w-[8%] hidden sm:table-cell",
    headerClassName: "w-[8%] hidden sm:table-cell",
  },

  {
    header: "Acciones",
    accessor: (job) => (
      <div className="flex items-center justify-center">
        <DumpActions job={job} />
      </div>
    ),
    className: "w-[11%]",
    headerClassName: "w-[11%]",
  },
];

export function DumpsTable({
  dumps,
  isLoading,
  total,
  page,
  pageSize,
  pagination,
}: DumpsTableProps) {
  const start = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {total > 0
          ? `Mostrando ${start}–${end} de ${total} ${total === 1 ? "registro" : "registros"}`
          : "Sin registros"}
      </p>
      <DataTable
        columns={columns}
        data={dumps}
        loading={isLoading}
        emptyMessage="No hay backups registrados"
        pagination={pagination}
      />
    </div>
  );
}
