import { DataTable, type Column } from "@/shared/ui/data-table";

import { ConnectionLabel } from "@/shared/components/ConnectionLabel";
import { EnvironmentBadge } from "@/shared/components/EnvironmentBadge";
import {
  Database,
  Trash2,
  RotateCw,
  CheckCircle2,
  XCircle,
  Link,
  Pencil,
  Clock,
  FileText,
  ChevronRight,
} from "lucide-react";
import type { AuditLog } from "../types";

interface AuditTableProps {
  logs: AuditLog[];
  isLoading: boolean;
  total: number;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function shortenId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "backup.created": Database,
  "backup.deleted": Trash2,
  "restore.started": RotateCw,
  "restore.completed": CheckCircle2,
  "restore.failed": XCircle,
  "connection.created": Link,
  "connection.updated": Pencil,
  "connection.deleted": Link,
  "cronjob.created": Clock,
  "cronjob.updated": Clock,
  "cronjob.deleted": Clock,
  "cronjob.toggled": Clock,
};

function ActionCell({ action }: { action: string }) {
  const Icon = ACTION_ICONS[action] ?? FileText;
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <code className="text-xs font-mono">{action}</code>
    </div>
  );
}

function ResourceCell({ log }: { log: AuditLog }) {
  const meta = log.metadata ?? {};
  const metaName =
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.connectionName === "string" && meta.connectionName) ||
    undefined;

  if (log.resourceType === "connection") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          conexión
        </span>
        <ConnectionLabel id={log.resourceId} name={metaName} className="text-sm" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {log.resourceType}
      </span>
      {metaName ? (
        <span className="text-sm truncate" title={`${metaName} (${log.resourceId})`}>
          {metaName}
        </span>
      ) : (
        <span
          className="font-mono text-xs text-muted-foreground"
          title={log.resourceId}
        >
          #{shortenId(log.resourceId)}
        </span>
      )}
    </div>
  );
}

function MetadataCell({ metadata }: { metadata?: Record<string, unknown> }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <details className="group">
      <summary className="cursor-pointer text-xs font-mono text-muted-foreground hover:text-foreground list-none flex items-center gap-1">
        <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
        Ver metadata
      </summary>
      <pre className="mt-2 rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
        {JSON.stringify(metadata, null, 2)}
      </pre>
    </details>
  );
}

const columns: Column<AuditLog>[] = [
  {
    header: "Fecha",
    accessor: (log) => (
      <span className="font-mono text-xs whitespace-nowrap">{formatDate(log.createdAt)}</span>
    ),
    className: "hidden sm:table-cell",
    headerClassName: "hidden sm:table-cell",
  },
  {
    header: "Usuario",
    accessor: (log) => (
      <span className="text-sm">{log.username}</span>
    ),
  },
  {
    header: "Acción",
    accessor: (log) => <ActionCell action={log.action} />,
  },
  {
    header: "Recurso",
    accessor: (log) => <ResourceCell log={log} />,
  },
  {
    header: "Ambiente",
    accessor: (log) => <EnvironmentBadge env={log.environment} />,
    className: "hidden sm:table-cell",
    headerClassName: "hidden sm:table-cell",
  },
  {
    header: "Metadata",
    accessor: (log) => <MetadataCell metadata={log.metadata} />,
    className: "hidden sm:table-cell",
    headerClassName: "hidden sm:table-cell",
  },
];

export default function AuditTable({ logs, isLoading, total }: AuditTableProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Mostrando {total} {total === 1 ? "registro" : "registros"}
      </p>
      <DataTable
        columns={columns}
        data={logs}
        loading={isLoading}
        emptyMessage="No hay registros de auditoría"
      />
    </div>
  );
}
