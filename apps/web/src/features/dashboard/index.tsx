import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { TetrominoLoader } from "@/shared/ui/TetrominoLoader";
import { useSmoothLoading } from "@/shared/hooks/useSmoothLoading";

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

  const rawLoading =
    dashboardLoading || connectionsLoading || storageLoading || cronjobsLoading || statsLoading || dailyCountsLoading;
  const isLoading = useSmoothLoading(rawLoading);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="dashboard-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex min-h-[calc(100vh-9rem)] w-full flex-col items-center justify-center p-8"
        >
          <TetrominoLoader size="md" label={t('header.loading')} />
        </motion.div>
      ) : dashboardErrors.length > 0 ? (
        <motion.div
          key="dashboard-error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full space-y-5 sm:space-y-8 p-4 sm:p-6"
        >
          <Alert variant="destructive">
            <AlertDescription>
              {t('error.load', { message: dashboardErrors[0]?.message ?? t('error.generic', { ns: 'common' }) })}
            </AlertDescription>
          </Alert>
        </motion.div>
      ) : (
        <motion.div
          key="dashboard-content"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full space-y-5 sm:space-y-8 p-4 sm:p-6"
        >
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
