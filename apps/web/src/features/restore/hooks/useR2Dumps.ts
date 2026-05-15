import { useQuery } from "@tanstack/react-query";
import { dumpsApi } from "@/features/dumps/api/dumps-api";
import type { EnrichedR2Object } from "@/features/dumps/types";
import type { BackupCategory } from "@/types/backup.types";

interface UseR2DumpsParams {
  connectionSlug: string | null;
  category: BackupCategory | null;
}

export function useR2Dumps({ connectionSlug, category }: UseR2DumpsParams) {
  return useQuery<EnrichedR2Object[]>({
    queryKey: ["r2-dumps", connectionSlug, category],
    queryFn: async () => {
      if (!connectionSlug || !category) return [];
      const response = await dumpsApi.getEnrichedR2Dumps({
        connectionSlug,
        category,
      });
      return Array.isArray(response) ? response : [];
    },
    enabled: !!connectionSlug && !!category,
    staleTime: 30_000,
  });
}
