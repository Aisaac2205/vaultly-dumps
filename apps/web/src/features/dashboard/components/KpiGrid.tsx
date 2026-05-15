import { StatCard } from "@/shared/ui/stat-card";
import {
  Database,
  CheckCircle,
  XCircle,
  Loader2,
  Activity,
  Clock,
  Calendar,
  PlayCircle,
} from "lucide-react";
import type {
  JobSummary,
  ConnectionEntity,
  CronjobEntity,
  HealthStatus,
} from "../types";
import { formatRelativeTime } from "../lib/format";

interface KpiGridProps {
  summary: JobSummary | null;
  connections: ConnectionEntity[];
  cronjobs: CronjobEntity[];
  health: HealthStatus | null;
  lastBackupDate: string | null;
}

export function KpiGrid({
  summary,
  connections,
  cronjobs,
  health,
  lastBackupDate,
}: KpiGridProps) {
  const activeConnections = connections.filter((c) => c.isActive).length;
  const activeCronjobs = cronjobs.filter((c) => c.isActive).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Backups"
        value={summary?.total ?? 0}
        icon={<Database className="h-4 w-4" />}
      />
      <StatCard
        label="Completados"
        value={summary?.completed ?? 0}
        icon={<CheckCircle className="h-4 w-4" />}
        statusColor="var(--color-success)"
      />
      <StatCard
        label="En progreso"
        value={summary?.running ?? 0}
        icon={<PlayCircle className="h-4 w-4" />}
        statusColor="var(--color-info)"
      />
      <StatCard
        label="Pendientes"
        value={summary?.pending ?? 0}
        icon={<Clock className="h-4 w-4" />}
      />
      <StatCard
        label="Fallidos"
        value={summary?.failed ?? 0}
        icon={<XCircle className="h-4 w-4" />}
        statusColor={
          summary && summary.failed > 0 ? "var(--color-error)" : undefined
        }
      />
      <StatCard
        label="Conexiones"
        value={`${activeConnections}/${connections.length}`}
        icon={<Database className="h-4 w-4" />}
      />
      <StatCard
        label="Cronjobs"
        value={`${activeCronjobs}/${cronjobs.length}`}
        icon={<Clock className="h-4 w-4" />}
      />
      <StatCard
        label="Último backup"
        value={
          lastBackupDate ? formatRelativeTime(lastBackupDate) : "N/A"
        }
        icon={<Calendar className="h-4 w-4" />}
      />
    </div>
  );
}
