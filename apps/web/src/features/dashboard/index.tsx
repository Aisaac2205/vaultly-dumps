import { useRef, useEffect } from "react";
import { useDashboard, useConnectionStats, useStorageStats } from "./hooks";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "./api/dashboard-api";
import { DashboardHeader } from "./components/DashboardHeader";
import { KpiGrid } from "./components/KpiGrid";
import { ConnectionHealthCard } from "./components/ConnectionHealthCard";
import { StorageCard } from "./components/StorageCard";
import { BackupTimeline } from "./components/BackupTimeline";
import { RestoreTimeline } from "./components/RestoreTimeline";
import { FailureAlertBanner } from "./components/FailureAlertBanner";
import { BackupAreaChart } from "./components/BackupAreaChart";
import { UpcomingCronjobsCard } from "./components/UpcomingCronjobsCard";
import { CardSkeleton, TableSkeleton } from "@/shared/ui/loading-skeleton";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { FadeIn } from "@/shared/ui/motion/FadeIn";

export default function Dashboard() {
  const {
    recentBackups,
    recentRestores,
    isLoading: dashboardLoading,
    errors: dashboardErrors,
  } = useDashboard();
  const { data: connections = [], isLoading: connectionsLoading } =
    useConnectionStats();
  const { data: dumps = [], isLoading: storageLoading } = useStorageStats();
  const { data: cronjobs = [], isLoading: cronjobsLoading } = useQuery({
    queryKey: ["dashboard", "cronjobs"],
    queryFn: async () => {
      const response = await dashboardApi.getCronjobs();
      return Array.isArray(response) ? response : [];
    },
    refetchInterval: 30_000,
  });
  const { data: stats = null, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardApi.getStats,
    refetchInterval: 15_000,
  });
  const { data: dailyCounts = [], isLoading: dailyCountsLoading } = useQuery({
    queryKey: ["dashboard", "daily-counts"],
    queryFn: dashboardApi.getDailyCounts,
    refetchInterval: 60_000,
  });

  const refreshCycle = useRef(0);

  useEffect(() => {
    refreshCycle.current += 1;
  }, [stats, dailyCounts, recentBackups, recentRestores, connections, dumps, cronjobs]);

  const isLoading =
    dashboardLoading || connectionsLoading || storageLoading || cronjobsLoading || statsLoading || dailyCountsLoading;

  if (isLoading) {
    return (
      <div className="w-full space-y-5 sm:space-y-8 p-4 sm:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (dashboardErrors.length > 0) {
    return (
      <div className="w-full space-y-5 sm:space-y-8 p-4 sm:p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Error al cargar el dashboard:{" "}
            {dashboardErrors[0]?.message ?? "Error desconocido"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <FadeIn className="w-full space-y-5 sm:space-y-8 p-4 sm:p-6">
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Dashboard actualizado (ciclo {refreshCycle.current})
      </div>

      <DashboardHeader lastUpdated={new Date()} />

      <FailureAlertBanner failedCount={stats?.failed7d ?? 0} />

      <KpiGrid stats={stats} connections={connections} />

      <BackupAreaChart data={dailyCounts} />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5 lg:items-stretch">
        <div className="flex flex-col lg:col-span-3">
          <BackupTimeline backups={recentBackups} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-2">
          <RestoreTimeline restores={recentRestores} />
          <StorageCard dumps={dumps} />
          <ConnectionHealthCard connections={connections} />
          <UpcomingCronjobsCard cronjobs={cronjobs} />
        </div>
      </div>
    </FadeIn>
  );
}
