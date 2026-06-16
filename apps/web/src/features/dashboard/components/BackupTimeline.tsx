import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { DataTable } from "@/shared/ui/data-table";
import { ConnectionLabel } from "@/shared/components/ConnectionLabel";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Clock } from "lucide-react";
import { shortId, formatDate } from "../lib/format";
import type { BackupJob } from "../types";
import type { Column } from "@/shared/ui/data-table";

interface BackupTimelineProps {
  backups: BackupJob[];
  maxItems?: number;
}

export function BackupTimeline({ backups, maxItems = 15 }: BackupTimelineProps) {
  const visible = maxItems > 0 ? backups.slice(0, maxItems) : backups;
  const remaining = maxItems > 0 ? Math.max(0, backups.length - maxItems) : 0;
  const hasBackups = backups.length > 0;

  const columns: Column<BackupJob>[] = [
    {
      header: "Conexión",
      accessor: (job) => (
        <div className="flex flex-col gap-0.5">
          <ConnectionLabel id={job.connectionId} name={job.connectionName} />
          <span className="font-mono text-[10px] text-muted-foreground/70">
            {shortId(job.id)}
          </span>
        </div>
      ),
    },
    {
      header: "Entorno",
      accessor: (job) => (
        <span className="font-mono text-xs uppercase text-muted-foreground">
          {job.environment}
        </span>
      ),
      className: "hidden md:table-cell",
      headerClassName: "hidden md:table-cell",
    },
    {
      header: "Estado",
      accessor: (job) => <StatusBadge status={job.status} />,
    },
    {
      header: "Cuándo",
      accessor: (job) => (
        <span className="font-mono text-xs whitespace-nowrap tabular-nums">
          {formatDate(job.createdAt)}
        </span>
      ),
      className: "w-24",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Últimos Backups</CardTitle>
      </CardHeader>
      <CardContent>
        {hasBackups ? (
          <>
            <DataTable columns={columns} data={visible} compact />
            {remaining > 0 && (
              <p className="py-2.5 text-center text-xs text-muted-foreground">
                +{remaining} más
              </p>
            )}
          </>
        ) : (
          <EmptyState
            icon={<Clock className="h-8 w-8" />}
            title="Sin backups recientes"
            description="No se ejecutaron backups en los últimos días."
          />
        )}
      </CardContent>
    </Card>
  );
}
