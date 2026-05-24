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
import { BackupStatusChart } from "./components/BackupStatusChart";
import { UpcomingCronjobsCard } from "./components/UpcomingCronjobsCard";
import { CardSkeleton, TableSkeleton } from "@/shared/ui/loading-skeleton";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export default function Dashboard() {
  const {
    summary,
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
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["dashboard", "health"],
    queryFn: dashboardApi.getHealth,
    refetchInterval: 60_000,
  });

  const isLoading =
    dashboardLoading || connectionsLoading || storageLoading || cronjobsLoading || healthLoading;
  const lastBackupDate =
    recentBackups.find((b) => b.status === "completed")?.createdAt ?? null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (dashboardErrors.length > 0) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
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
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <DashboardHeader lastUpdated={new Date()} />

      <FailureAlertBanner failedCount={summary?.failed ?? 0} />

      <KpiGrid
        summary={summary}
        connections={connections}
        cronjobs={cronjobs}
        health={health ?? null}
        lastBackupDate={lastBackupDate}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BackupStatusChart summary={summary} />
        </div>
        <ConnectionHealthCard connections={connections} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:items-stretch">
        <div className="flex flex-col lg:col-span-3">
          <BackupTimeline backups={recentBackups} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-2">
          <StorageCard dumps={dumps} />
          <RestoreTimeline restores={recentRestores} />
          <UpcomingCronjobsCard cronjobs={cronjobs} />
        </div>
      </div>
    </div>
  );
}
