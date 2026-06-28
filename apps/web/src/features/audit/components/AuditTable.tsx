import { DataTable, type Column } from "@/shared/ui/data-table";
import { ConnectionLabel } from "@/shared/components/ConnectionLabel";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/shared/ui/pagination";
import { useTranslation } from "react-i18next";
import { formatDateTimeShort } from "@/lib/format";
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
  ClipboardList,
} from "lucide-react";
import type { AuditLog } from "../types";

interface AuditTableProps {
  logs: AuditLog[];
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
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

function ResourceCell({ log, resourceLabel }: { log: AuditLog; resourceLabel: string }) {
  const meta = log.metadata ?? {};
  const metaName =
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.connectionName === "string" && meta.connectionName) ||
    undefined;

  if (log.resourceType === "connection") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {resourceLabel}
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

function MetadataCell({ metadata, viewLabel }: { metadata?: Record<string, unknown>; viewLabel: string }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <details className="group">
      <summary className="cursor-pointer text-xs font-mono text-muted-foreground hover:text-foreground list-none flex items-center gap-1">
        <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
        {viewLabel}
      </summary>
      <pre className="mt-2 rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
        {JSON.stringify(metadata, null, 2)}
      </pre>
    </details>
  );
}

function AuditPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation('audit');
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-sm text-muted-foreground">
        {t('showing', { start: startItem, end: endItem, total })}
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
            />
          </PaginationItem>
          {getPageNumbers().map((p, i) =>
            p === "..." ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={page === p}
                  onClick={() => onPageChange(p as number)}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export default function AuditTable({
  logs,
  isLoading,
  total,
  page,
  pageSize,
  onPageChange,
}: AuditTableProps) {
  const { t } = useTranslation('audit')

  const columns: Column<AuditLog>[] = [
    {
      header: t('column.date'),
      accessor: (log) => (
        <span className="font-mono text-xs whitespace-nowrap">{formatDateTimeShort(log.createdAt)}</span>
      ),
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
    },
    {
      header: t('column.user'),
      accessor: (log) => (
        <span className="text-sm">{log.username}</span>
      ),
    },
    {
      header: t('column.action'),
      accessor: (log) => <ActionCell action={log.action} />,
    },
    {
      header: t('column.resource'),
      accessor: (log) => <ResourceCell log={log} resourceLabel={t('resource.connection')} />,
    },
    {
      header: t('column.environment'),
      accessor: (log) => (
        <span className="font-mono text-xs text-muted-foreground uppercase">{log.environment}</span>
      ),
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
    },
    {
      header: t('column.metadata'),
      accessor: (log) => <MetadataCell metadata={log.metadata} viewLabel={t('metadata.view')} />,
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
    },
  ];

  return (
    <div className="space-y-2">
      {logs.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ClipboardList className="h-8 w-8 mb-3 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">
            {t('empty.title')}
          </p>
          <p className="text-xs mt-1">
            {t('empty.description')}
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          loading={isLoading}
          emptyMessage={t('empty.title')}
          pagination={
            <AuditPagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={onPageChange}
            />
          }
        />
      )}
    </div>
  );
}
