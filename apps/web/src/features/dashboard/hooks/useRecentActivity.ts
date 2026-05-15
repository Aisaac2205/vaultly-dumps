import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard-api";

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ["dashboard", "activity", limit],
    queryFn: () => dashboardApi.getRecentAudit(limit),
    refetchInterval: 30_000,
  });
}
