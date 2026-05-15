import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard-api";

export function useStorageStats() {
  return useQuery({
    queryKey: ["dashboard", "storage"],
    queryFn: async () => {
      const response = await dashboardApi.getDumpsFromR2();
      return Array.isArray(response) ? response : [];
    },
    refetchInterval: 60_000,
  });
}
