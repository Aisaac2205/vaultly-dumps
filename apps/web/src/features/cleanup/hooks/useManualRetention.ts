import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { manualRetentionApi } from "../api/retention-api";
import type {
  ManualRetentionSettings,
  ManualRetentionUpdate,
} from "../types";

const QUERY_KEY = ["manual-retention"];

export function useManualRetention() {
  return useQuery<ManualRetentionSettings>({
    queryKey: QUERY_KEY,
    queryFn: manualRetentionApi.get,
    staleTime: 60_000,
  });
}

export function useUpdateManualRetention() {
  const queryClient = useQueryClient();
  return useMutation<ManualRetentionSettings, Error, ManualRetentionUpdate>({
    mutationFn: manualRetentionApi.update,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });
}
