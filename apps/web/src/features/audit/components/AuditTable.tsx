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
import { formatDateTimeShort, formatEnvironment } from "@/lib/format";
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
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <code className="text-xs font-mono text-text-primary">{action}</code>
    </div>
  );
}

function formatResourceType(type: string): string {
  if (!type) return "";
  return type.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function MetadataCell({
  log,
  viewLabel,
}: {
  log: AuditLog;
  viewLabel: string;
}) {
  const meta = log.metadata ?? {};
  const metaName =
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.connectionName === "string" && meta.connectionName) ||
    undefined;

  const hasMeta = Object.keys(meta).length > 0;
  const showId = log.resourceId && log.resourceId !== "unknown";
  const formattedType = formatResourceType(log.resourceType);

  return (
    <div className="flex flex-col items-center gap-1.5 py-0.5 w-full min-w-0">
      <div className="flex items-center justify-center gap-2 min-w-0">
        {log.resourceType === "connection" ? (
          <ConnectionLabel id={log.resourceId} name={metaName} className="text-xs truncate font-medium" />
        ) : metaName ? (
          <span className="text-xs font-medium text-text-primary truncate" title={`${metaName} (${log.resourceId})`}>
            {metaName}
          </span>
        ) : showId ? (
          <span
            className="font-mono text-xs text-muted-foreground truncate"
            title={log.resourceId}
          >
            #{shortenId(log.resourceId)}
          </span>
        ) : null}
        {formattedType && (
          <span className="text-[11px] text-muted-foreground/70 shrink-0 font-medium">
            {formattedType}
          </span>
        )}
      </div>

      {hasMeta && (
        <details className="group w-full block text-center">
          <summary className="cursor-pointer text-xs font-mono text-muted-foreground hover:text-foreground list-none inline-flex items-center justify-center gap-1 transition-colors">
            <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90 text-muted-foreground/70 shrink-0" />
            <span>{viewLabel}</span>
          </summary>
          <pre className="mt-2 w-full rounded-lg border border-border/50 bg-muted/40 p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-60 overflow-y-auto text-muted-foreground text-left leading-relaxed">
            {JSON.stringify(meta, null, 2)}
          </pre>
        </details>
      )}
    </div>
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
    <div className="flex w-full items-center justify-between gap-4">
      <p className="text-xs text-muted-foreground whitespace-nowrap">
        {t('showing', { start: startItem, end: endItem, total })}
      </p>
      <Pagination className="mx-0 w-auto">
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
  const { t } = useTranslation('audit');

  const columns: Column<AuditLog>[] = [
    {
      header: t('column.date'),
      accessor: (log) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
          {formatDateTimeShort(log.createdAt)}
        </span>
      ),
      className: "w-36 hidden sm:table-cell",
      headerClassName: "w-36 hidden sm:table-cell",
    },
    {
      header: t('column.user'),
      accessor: (log) => (
        <span className="text-sm font-medium text-text-primary truncate">{log.username}</span>
      ),
      className: "w-32 text-left",
      headerClassName: "w-32 text-left",
    },
    {
      header: t('column.action'),
      accessor: (log) => <ActionCell action={log.action} />,
      className: "w-44 text-left",
      headerClassName: "w-44 text-left",
    },
    {
      header: t('column.environment'),
      accessor: (log) => (
        <span className="text-xs text-muted-foreground">
          {formatEnvironment(log.environment)}
        </span>
      ),
      className: "w-28 text-center hidden sm:table-cell",
      headerClassName: "w-28 text-center hidden sm:table-cell",
    },
    {
      header: t('column.metadata'),
      accessor: (log) => <MetadataCell log={log} viewLabel={t('metadata.view')} />,
      className: "text-center",
      headerClassName: "text-center",
    },
  ];

  return (
    <div className="space-y-2">
      {logs.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground rounded-xl bg-card border border-border/60">
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
          rowHref={(log) => `/audit/${log.id}`}
          rowLinkLabel={(log) => t('detail.linkLabel', { id: log.id })}
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
