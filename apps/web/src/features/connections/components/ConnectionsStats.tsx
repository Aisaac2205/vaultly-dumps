import { StatCard } from "@/shared/ui/stat-card";
import { Database, Activity, Layers, Server } from "lucide-react";
import type { Connection } from "../types";

interface ConnectionsStatsProps {
  connections: Connection[];
  loading?: boolean;
}

export function ConnectionsStats({
  connections,
  loading = false,
}: ConnectionsStatsProps) {
  const total = connections.length;
  const active = connections.filter((c) => c.isActive).length;

  const byEnv: Record<string, number> = {};
  connections.forEach((c) => {
    byEnv[c.environment] = (byEnv[c.environment] ?? 0) + 1;
  });
  const topEnv = Object.entries(byEnv).sort((a, b) => b[1] - a[1])[0];

  const byType: Record<string, number> = {};
  connections.forEach((c) => {
    byType[c.dbType] = (byType[c.dbType] ?? 0) + 1;
  });
  const postgres = byType["postgres"] ?? 0;
  const mysql = byType["mysql"] ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total conexiones"
        value={total}
        icon={<Database className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        label="Activas"
        value={active}
        icon={<Activity className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        label="Por ambiente"
        value={
          topEnv
            ? `${topEnv[0]} (${topEnv[1]})`
            : total > 0
              ? "—"
              : "N/A"
        }
        icon={<Layers className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        label="Por tipo de BD"
        value={`PG ${postgres} / MySQL ${mysql}`}
        icon={<Server className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
}
