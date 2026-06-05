import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { maintenanceApi } from "../api/maintenance-api";
import type {
  StorageOverview,
  DbHygienePreview,
  DbHygieneResult,
} from "../types";

export function useStorageOverview() {
  return useQuery<StorageOverview>({
    queryKey: ["storage-overview"],
    queryFn: maintenanceApi.storageOverview,
    staleTime: 30_000,
  });
}

export function useDbHygienePreview(olderThanDays: number, enabled: boolean) {
  return useQuery<DbHygienePreview>({
    queryKey: ["db-hygiene-preview", olderThanDays],
    queryFn: () => maintenanceApi.dbHygienePreview(olderThanDays),
    enabled,
    staleTime: 10_000,
  });
}

export function useRunDbHygiene() {
  const queryClient = useQueryClient();
  return useMutation<DbHygieneResult, Error, number>({
    mutationFn: (olderThanDays) => maintenanceApi.dbHygieneRun(olderThanDays),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["db-hygiene-preview"] });
      void queryClient.invalidateQueries({ queryKey: ["dumps"] });
    },
  });
}
