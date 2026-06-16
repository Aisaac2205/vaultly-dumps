import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { BackupJob, DumpsFilters, PaginatedDumps } from "../types";
import { dumpsApi, type GetHistoryParams } from "../api/dumps-api";

interface UseDumpsParams {
  page: number;
  pageSize: number;
  filters: DumpsFilters;
}

interface UseDumpsReturn {
  data: BackupJob[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDumps({
  page,
  pageSize,
  filters,
}: UseDumpsParams): UseDumpsReturn {
  const queryKey = ["dumps", "history", { page, pageSize, filters }] as const;

  const queryFn = useCallback((): Promise<PaginatedDumps> => {
    const params: GetHistoryParams = { page, pageSize };

    if (
      filters.connectionId ||
      filters.environment ||
      filters.status ||
      filters.from ||
      filters.to
    ) {
      params.filters = filters;
    }

    return dumpsApi.getHistory(params);
  }, [page, pageSize, filters]);

  const query = useQuery<PaginatedDumps, Error>({
    queryKey,
    queryFn,
    staleTime: 30_000,
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? page,
    pageSize: query.data?.pageSize ?? pageSize,
    isLoading: query.isLoading,
    error: query.error,
    refetch,
  };
}
