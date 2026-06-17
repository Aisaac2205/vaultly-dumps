import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { connectionRetentionApi } from "../api/connection-retention-api";
import type {
  ConnectionRetentionPolicyInput,
  RetentionPreviewItem,
  RetentionRunItem,
} from "../types";

const QUERY_KEY = ["connection-retention"] as const;

export function useRetentionPolicies(connectionSlug: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, connectionSlug, "policies"],
    queryFn: () => connectionRetentionApi.getPolicies(connectionSlug),
    enabled: connectionSlug !== "",
    staleTime: 30_000,
  });
}

export function useUpdateRetentionPolicies(connectionSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (policies: ConnectionRetentionPolicyInput[]) =>
      connectionRetentionApi.updatePolicies(connectionSlug, policies),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, connectionSlug],
      });
    },
  });
}

export function useRetentionPreview(connectionSlug: string) {
  return useQuery<RetentionPreviewItem[]>({
    queryKey: [...QUERY_KEY, connectionSlug, "preview"],
    queryFn: () => connectionRetentionApi.getPreview(connectionSlug),
    enabled: connectionSlug !== "",
    staleTime: 15_000,
  });
}

export function useRunRetention(connectionSlug: string) {
  const queryClient = useQueryClient();

  return useMutation<RetentionRunItem[], Error>({
    mutationFn: () => connectionRetentionApi.runCleanup(connectionSlug),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, connectionSlug, "preview"],
      });
      void queryClient.invalidateQueries({ queryKey: ["dumps"] });
      void queryClient.invalidateQueries({ queryKey: ["r2-dumps"] });
    },
  });
}
