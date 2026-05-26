import { DataTable } from "@/shared/ui/data-table";
import { shortId, formatDate } from "../lib/format";
import type { RestoreJob } from "../types";
import type { Column } from "@/shared/ui/data-table";

const MAX_ITEMS = 7;

const STATUS_COLORS: Record<RestoreJob["status"], string> = {
  completed: "bg-success",
  failed: "bg-destructive",
  running: "bg-warning",
  pending: "bg-muted-foreground",
};

interface RestoreTimelineProps {
  restores: RestoreJob[];
}

export function RestoreTimeline({ restores }: RestoreTimelineProps) {
  const visible = restores.slice(0, MAX_ITEMS);
  const remaining = Math.max(0, restores.length - MAX_ITEMS);

  const columns: Column<RestoreJob>[] = [
    {
      header: "ID",
      accessor: (job) => (
        <span className="font-mono text-xs">{shortId(job.id)}</span>
      ),
      className: "w-20",
    },
    {
      header: "Entorno",
      accessor: (job) => job.targetEnvironment,
      className: "w-20",
    },
    {
      header: "Dry Run",
      accessor: (job) => (job.isDryRun ? "Sí" : "No"),
      className: "w-16 text-center",
      headerClassName: "text-center",
    },
    {
      header: "Estado",
      accessor: (job) => (
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLORS[job.status]}`}
          title={job.status}
        />
      ),
      className: "w-8 text-center",
      headerClassName: "text-center",
    },
    {
      header: "Fecha",
      accessor: (job) => (
        <span className="font-mono text-xs whitespace-nowrap">{formatDate(job.createdAt)}</span>
      ),
      className: "w-28",
    },
  ];

  return (
    <div>
      <h3 className="mb-3 text-base font-semibold">Últimos Restores</h3>
      <DataTable
        columns={columns}
        data={visible}
        emptyMessage="No hay restores recientes"
        compact
      />
      {remaining > 0 && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          +{remaining} más
        </p>
      )}
    </div>
  );
}
