import { useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
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
} from "lucide-react";
import type { RestoreJob } from "../types";
import { cn } from "@/shared/lib/cn";

interface RestoreHistoryProps {
  jobs: RestoreJob[];
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
const STATUS_FILTERS = [
  "Todos",
  "completed",
  "failed",
  "running",
  "pending",
] as const;

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
  isLoading,
}: RestoreHistoryProps) {
  const [envFilter, setEnvFilter] = useState<string>("Todos");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [envOpen, setEnvOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const hasFilters = envFilter !== "Todos" || statusFilter !== "Todos";

  const filteredJobs = jobs.filter((job) => {
    const envMatch =
      envFilter === "Todos" || job.targetEnvironment === envFilter;
    const statusMatch =
      statusFilter === "Todos" || job.status === statusFilter;
    return envMatch && statusMatch;
  });

  const displayJobs = hasFilters ? filteredJobs : filteredJobs.slice(0, 14);

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
    <div className="flex h-full flex-col">
      {/* Header with filters */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Historial de restores</h3>
          <p className="text-xs text-muted-foreground">
            Revisa los restores anteriores y su estado.
          </p>
        </div>
        <div className="flex gap-2">
          <Popover open={envOpen} onOpenChange={setEnvOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl">
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
              <Button variant="outline" size="sm" className="gap-2 rounded-xl">
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

      {/* Table */}
      {displayJobs.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground">
          No hay restores registrados aún.
        </p>
      ) : (
        <div className="flex-1 max-h-[720px] overflow-auto rounded-xl border border-border/50">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="py-2.5 text-xs uppercase font-medium tracking-wide text-muted-foreground">
                  Fecha y hora
                </TableHead>
                <TableHead className="py-2.5 text-xs uppercase font-medium tracking-wide text-muted-foreground">
                  Ambiente
                </TableHead>
                <TableHead className="py-2.5 text-xs uppercase font-medium tracking-wide text-muted-foreground">
                  Estado
                </TableHead>
                <TableHead className="py-2.5 text-xs uppercase font-medium tracking-wide text-muted-foreground">
                  Duración
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayJobs.map((job) => {
                const config = statusConfig[job.status];
                return (
                  <TableRow
                    key={job.id}
                    data-state={job.status === "running" ? "active" : undefined}
                    className="border-border/20 hover:bg-muted/40 data-[state=active]:bg-blue-500/5 data-[state=active]:shadow-[inset_3px_0_0_rgba(59,130,246,0.5)]"
                  >
                    <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                      {job.startedAt ? formatDate(job.startedAt) : "—"}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className="rounded-full text-xs font-normal"
                      >
                        {job.targetEnvironment ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            config.dotClass,
                          )}
                        />
                        <span
                          className={cn("text-xs font-medium", config.textClass)}
                        >
                          {config.label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 font-mono text-xs text-muted-foreground">
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
