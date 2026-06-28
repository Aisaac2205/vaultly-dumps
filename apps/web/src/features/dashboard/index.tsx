import { useState, useEffect } from "react";
import { useDashboard, useConnectionStats, useStorageStats } from "./hooks";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { dashboardApi } from "./api/dashboard-api";
import { DashboardHeader } from "./components/DashboardHeader";
import { KpiGrid } from "./components/KpiGrid";
import { SystemHealthCard } from "./components/SystemHealthCard";
import { BackupTimeline } from "./components/BackupTimeline";
import { RestoreTimeline } from "./components/RestoreTimeline";
import { BackupAreaChart } from "./components/BackupAreaChart";
import { UpcomingCronjobsCard } from "./components/UpcomingCronjobsCard";
import { CardSkeleton, TableSkeleton } from "@/shared/ui/loading-skeleton";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { FadeIn } from "@/shared/ui/motion/FadeIn";

export default function Dashboard() {
  const { t } = useTranslation('dashboard')
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

  const [refreshCycle, setRefreshCycle] = useState(0);

  const statsDeps = stats ? "loaded" : "empty";
  const backupsLen = recentBackups.length;
  const restoresLen = recentRestores.length;
  const connectionsLen = connections.length;
  const dumpsLen = dumps.length;
  const cronjobsLen = cronjobs.length;
  const dailyCountsLen = dailyCounts.length;

  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshCycle((c) => c + 1);
    }, 0);
    return () => clearTimeout(timer);
  }, [
    statsDeps,
    backupsLen,
    restoresLen,
    connectionsLen,
    dumpsLen,
    cronjobsLen,
    dailyCountsLen,
  ]);

  const isLoading =
    dashboardLoading || connectionsLoading || storageLoading || cronjobsLoading || statsLoading || dailyCountsLoading;

  if (isLoading) {
    return (
      <div
        className="w-full space-y-5 sm:space-y-8 p-4 sm:p-6"
        role="status"
        aria-busy="true"
        aria-label={t('header.loading')}
      >
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
            {t('error.load', { message: dashboardErrors[0]?.message ?? t('error.generic', { ns: 'common' }) })}
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
        {t('header.liveUpdate', { cycle: refreshCycle })}
      </div>

      <DashboardHeader lastUpdated={new Date()} />

      <KpiGrid stats={stats} connections={connections} dailyCounts={dailyCounts} />

      <BackupAreaChart data={dailyCounts} />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5 lg:items-start">
        <div className="lg:col-span-3">
          <BackupTimeline backups={recentBackups} />
        </div>
        <div className="flex flex-col gap-4 sm:gap-6 lg:col-span-2">
          <RestoreTimeline restores={recentRestores} />
          <SystemHealthCard dumps={dumps} />
          <UpcomingCronjobsCard cronjobs={cronjobs} />
        </div>
      </div>
    </FadeIn>
  );
}
