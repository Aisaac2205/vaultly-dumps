import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cleanupApi } from "../api/cleanup-api";
import type { CleanupParams, CleanupPreview, CleanupResult } from "../types";

export function useCleanupPreview(params: CleanupParams | null) {
  return useQuery<CleanupPreview>({
    queryKey: ["cleanup-preview", params],
    queryFn: () =>
      params
        ? cleanupApi.preview(params)
        : Promise.reject(new Error("Parámetros de limpieza incompletos")),
    enabled: params !== null,
    staleTime: 10_000,
  });
}

export function useRunCleanup() {
  const queryClient = useQueryClient();
  return useMutation<CleanupResult, Error, CleanupParams>({
    mutationFn: (params) => cleanupApi.run(params),
    onSuccess: () => {
      // Refresh anything that lists dumps so removed ones disappear.
      void queryClient.invalidateQueries({ queryKey: ["cleanup-preview"] });
      void queryClient.invalidateQueries({ queryKey: ["r2-dumps"] });
      void queryClient.invalidateQueries({ queryKey: ["dumps"] });
    },
  });
}
