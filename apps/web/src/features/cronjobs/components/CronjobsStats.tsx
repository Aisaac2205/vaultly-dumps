import { StatCard } from "@/shared/ui/stat-card";
import { Clock, Play, CheckCircle2, Calendar } from "lucide-react";
import type { Cronjob } from "../types";

interface CronjobsStatsProps {
  cronjobs: Cronjob[];
  loading?: boolean;
}

export function CronjobsStats({
  cronjobs,
  loading = false,
}: CronjobsStatsProps) {
  const total = cronjobs.length;
  const active = cronjobs.filter((c) => c.isActive).length;

  const byStatus: Record<string, number> = {};
  cronjobs.forEach((c) => {
    if (c.lastStatus) {
      byStatus[c.lastStatus] = (byStatus[c.lastStatus] ?? 0) + 1;
    }
  });
  const topStatus = Object.entries(byStatus).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const nextRunTimes = cronjobs
    .filter((c) => c.nextRunAt)
    .map((c) => new Date(c.nextRunAt!).getTime())
    .sort((a, b) => a - b);
  const earliest =
    nextRunTimes.length > 0
      ? new Date(nextRunTimes[0]).toLocaleString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const STATUS_LABELS: Record<string, string> = {
    pending: "Pendiente",
    running: "En progreso",
    completed: "Completado",
    failed: "Fallido",
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total cronjobs"
        value={total}
        icon={<Clock className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        label="Activos"
        value={active}
        icon={<Play className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        label="Estado principal"
        value={
          topStatus
            ? `${STATUS_LABELS[topStatus[0]] ?? topStatus[0]} (${topStatus[1]})`
            : total > 0
              ? "—"
              : "N/A"
        }
        icon={<CheckCircle2 className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        label="Próxima ejecución"
        value={earliest ?? "—"}
        icon={<Calendar className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
}
