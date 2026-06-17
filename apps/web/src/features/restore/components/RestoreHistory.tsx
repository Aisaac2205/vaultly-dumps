import { useEffect, useMemo, useState, useRef } from "react";
import { Badge } from "@/shared/ui/badge";
import { StatusBadge } from "@/shared/ui/status-badge";
import { EmptyState } from "@/shared/ui/empty-state";
import postgresSvg from "@/shared/assets/PostgresSQL.svg";
import mysqlSvg from "@/shared/assets/MySQL.svg";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import {
  Filter,
  ChevronDown,
  Check,
  History as HistoryIcon,
} from "lucide-react";
import type { RestoreJob, Connection } from "../types";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

interface RestoreHistoryProps {
  jobs: RestoreJob[];
  connections: Connection[];
  isLoading: boolean;
}

const statusConfig: Record<
  RestoreJob["status"],
  { label: string; dotClass: string; textClass: string }
> = {
  completed: {
    label: "Completado",
    dotClass: "bg-green-500",
    textClass: "text-green-600 dark:text-green-400",
  },
  failed: {
    label: "Error",
    dotClass: "bg-red-500",
    textClass: "text-red-600 dark:text-red-400",
  },
  running: {
    label: "Ejecutando",
    dotClass: "bg-blue-500 animate-pulse",
    textClass: "text-blue-600 dark:text-blue-400",
  },
  pending: {
    label: "Pendiente",
    dotClass: "bg-muted-foreground/40",
    textClass: "text-muted-foreground",
  },
};

const ENV_FILTERS = ["Todos", "dev", "sqa", "prod"] as const;
const STATUS_FILTERS = ["Todos", "completed", "failed"] as const;

function formatDuration(
  startedAt: string,
  completedAt: string | null,
): string {
  if (!completedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = end - start;
  if (diffMs < 1000) return `${diffMs}ms`;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RestoreHistory({
  jobs,
  connections,
  isLoading,
}: RestoreHistoryProps) {
  const connectionMap = useMemo(() => {
    const map = new Map<string, { name: string; database: string; dbType: string }>();
    for (const c of connections) map.set(c.id, { name: c.name, database: c.database, dbType: c.dbType });
    return map;
  }, [connections]);

  const DB_LOGOS: Record<string, string> = {
    postgres: postgresSvg as string,
    mysql: mysqlSvg as string,
  };
  const [envFilter, setEnvFilter] = useState<string>("Todos");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [envOpen, setEnvOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);

  const filteredJobs = jobs.filter((job) => {
    const envMatch =
      envFilter === "Todos" || job.targetEnvironment === envFilter;
    const statusMatch =
      statusFilter === "Todos" || job.status === statusFilter;
    return envMatch && statusMatch;
  });

  // Reset scroll position when filters change
  useEffect(() => {
    if (tableRef.current) tableRef.current.scrollTop = 0;
  }, [envFilter, statusFilter]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 h-full flex-col">
      {/* Header with filters */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HistoryIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Historial</h3>
          {filteredJobs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({filteredJobs.length})
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Popover open={envOpen} onOpenChange={setEnvOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                <Filter className="h-3.5 w-3.5" />
                {envFilter === "Todos" ? "Ambiente" : envFilter}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="end">
              {ENV_FILTERS.map((env) => (
                <button
                  key={env}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => {
                    setEnvFilter(env);
                    setEnvOpen(false);
                  }}
                >
                  <Check
                    className={`h-4 w-4 ${envFilter === env ? "opacity-100" : "opacity-0"}`}
                  />
                  {env}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <Popover open={statusOpen} onOpenChange={setStatusOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                <Filter className="h-3.5 w-3.5" />
                {statusFilter === "Todos"
                  ? "Estado"
                  : statusConfig[statusFilter as RestoreJob["status"]]?.label}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="end">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => {
                    setStatusFilter(status);
                    setStatusOpen(false);
                  }}
                >
                  <Check
                    className={`h-4 w-4 ${statusFilter === status ? "opacity-100" : "opacity-0"}`}
                  />
                  {status === "Todos"
                    ? "Todos"
                    : statusConfig[status as RestoreJob["status"]]?.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredJobs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={<HistoryIcon className="h-8 w-8" />}
            title="No hay restores registrados"
            description="Los restores ejecutados aparecerán acá."
          />
        </div>
      ) : (
        <div
          ref={tableRef}
          className="min-h-0 flex-1 overflow-auto rounded-lg border border-border"
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-3">Conexión</TableHead>
                <TableHead className="py-3">Fecha</TableHead>
                <TableHead className="py-3">Ambiente</TableHead>
                <TableHead className="py-3">Estado</TableHead>
                <TableHead className="py-3 text-right">Duración</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => {
                const info = job.targetConnectionId ? connectionMap.get(job.targetConnectionId) : undefined;
                return (
                  <TableRow key={job.id} className="hover:bg-muted/40">
                    <TableCell className="py-3 max-w-[180px]">
                      {info ? (
                        <div className="flex items-center gap-2">
                          {DB_LOGOS[info.dbType] && (
                            <img src={DB_LOGOS[info.dbType]} alt={info.dbType} className="h-4 w-4 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium" title={info.name}>{info.name}</p>
                            <p className="truncate font-mono text-[11px] text-muted-foreground" title={info.database}>{info.database}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-3 font-mono text-xs text-muted-foreground">
                      {job.startedAt ? formatDate(job.startedAt) : "—"}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className="rounded-full text-xs font-normal">
                        {job.targetEnvironment ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-3 text-right font-mono text-xs text-muted-foreground">
                      {job.startedAt
                        ? formatDuration(
                            job.startedAt,
                            job.completedAt ?? null,
                          )
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
