import { useQuery } from "@tanstack/react-query";
import { restoreApi } from "../api/restore-api";

export function useRestoreHistory() {
  return useQuery({
    queryKey: ["restore", "history"],
    queryFn: async () => {
      const response = await restoreApi.getRestoreHistory();
      return Array.isArray(response) ? response : [];
    },
    refetchInterval: 10_000,
  });
}
