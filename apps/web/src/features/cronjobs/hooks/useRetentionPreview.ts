import { useQuery } from "@tanstack/react-query";
import apiClient from "@/shared/lib/api-client";
import type { BackupCategory } from "@/types/backup.types";
import type { RetentionPreview } from "../types";

export interface RetentionPreviewParams {
  connectionSlug: string;
  category: BackupCategory;
  keepLast?: number;
  maxAgeDays?: number;
  maxTotalSizeMb?: number;
}

/**
 * Live preview of what a retention policy would prune right now. Reuses the
 * maintenance cleanup preview endpoint (same engine the cron applies).
 */
export function useRetentionPreview(params: RetentionPreviewParams | null) {
  return useQuery<RetentionPreview>({
    queryKey: ["retention-preview", params],
    queryFn: () =>
      params
        ? apiClient
            .get<RetentionPreview>("/maintenance/cleanup/preview", { params })
            .then((r) => r.data)
        : Promise.reject(new Error("Incomplete retention policy")),
    enabled: params !== null,
    staleTime: 10_000,
  });
}
