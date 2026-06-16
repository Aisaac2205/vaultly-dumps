import { StatCard } from "@/shared/ui/stat-card";
import { Stagger, StaggerItem } from "@/shared/ui/motion/Stagger";
import {
  CheckCircle,
  XCircle,
  CalendarCheck,
  Database,
} from "lucide-react";
import type { DashboardStats, ConnectionEntity } from "../types";

interface KpiGridProps {
  stats: DashboardStats | null;
  connections: ConnectionEntity[];
}

export function KpiGrid({ stats, connections }: KpiGridProps) {
  const active = connections.filter((c) => c.isActive).length;

  return (
    <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StaggerItem>
        <StatCard
          label="Tasa de éxito (30d)"
          value={stats ? `${stats.successRate30d}%` : "—"}
          icon={<CheckCircle className="h-4 w-4" />}
          variant="outlined"
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="Backups hoy"
          value={stats?.backupsToday ?? 0}
          icon={<CalendarCheck className="h-4 w-4" />}
          variant="outlined"
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="Fallidos (7d)"
          value={stats?.failed7d ?? 0}
          icon={<XCircle className="h-4 w-4" />}
          statusColor={
            stats && stats.failed7d > 0 ? "var(--color-error)" : undefined
          }
          variant="outlined"
        />
      </StaggerItem>
      <StaggerItem>
        <StatCard
          label="Conexiones activas"
          value={`${active}/${connections.length}`}
          icon={<Database className="h-4 w-4" />}
          variant="outlined"
        />
      </StaggerItem>
    </Stagger>
  );
}
