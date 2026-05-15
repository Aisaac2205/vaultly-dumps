import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard-api";

export function useConnectionStats() {
  return useQuery({
    queryKey: ["dashboard", "connections"],
    queryFn: async () => {
      const response = await dashboardApi.getConnections();
      return Array.isArray(response) ? response : [];
    },
    refetchInterval: 30_000,
  });
}
