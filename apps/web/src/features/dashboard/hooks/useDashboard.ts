import { useQueries } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard-api";

export function useDashboard() {
  const results = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "summary"],
        queryFn: dashboardApi.getSummary,
        refetchInterval: 15_000,
      },
      {
        queryKey: ["dashboard", "recent-backups"],
        queryFn: () => dashboardApi.getRecentBackups(10),
        refetchInterval: 15_000,
      },
      {
        queryKey: ["dashboard", "recent-restores"],
        queryFn: () => dashboardApi.getRecentRestores(5),
        refetchInterval: 15_000,
      },
    ],
  });

  return {
    summary: results[0].data ?? null,
    recentBackups: Array.isArray(results[1].data) ? results[1].data : [],
    recentRestores: Array.isArray(results[2].data) ? results[2].data : [],
    isLoading: results.some((r) => r.isLoading),
    errors: results.map((r) => r.error).filter(Boolean),
  };
}
