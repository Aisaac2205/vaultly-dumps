import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { BackupJob, DumpsFilters } from "../types";
import apiClient from "../../../shared/lib/api-client";

const DEFAULT_LIMIT = 10;

interface UseDumpsReturn {
  dumps: BackupJob[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  filters: DumpsFilters;
  applyFilters: (filters: DumpsFilters) => void;
  resetFilters: () => void;
  refetch: () => Promise<void>;
}

function hasActiveFilters(filters: DumpsFilters): boolean {
  return !!(
    filters.connectionId ||
    filters.environment ||
    filters.status ||
    filters.from ||
    filters.to
  );
}

function filterDumps(data: BackupJob[], filters: DumpsFilters): BackupJob[] {
  let result = [...data];

  if (filters.connectionId) {
    result = result.filter((d) => d.connectionId === filters.connectionId);
  }

  if (filters.environment) {
    result = result.filter((d) => d.environment === filters.environment);
  }

  if (filters.status) {
    result = result.filter((d) => d.status === filters.status);
  }

  if (filters.from) {
    const fromDate = new Date(filters.from);
    result = result.filter((d) => new Date(d.createdAt) >= fromDate);
  }

  if (filters.to) {
    const toDate = new Date(filters.to);
    toDate.setHours(23, 59, 59, 999);
    result = result.filter((d) => new Date(d.createdAt) <= toDate);
  }

  return result;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchDumpsHistory(): Promise<{ data: BackupJob[]; total: number }> {
  const response = await apiClient.get<PaginatedResponse<BackupJob>>("/backups/history");
  return {
    data: response.data.data,
    total: response.data.total,
  };
}

export function useDumps(): UseDumpsReturn {
  const [filters, setFilters] = useState<DumpsFilters>({});

  const query = useQuery<{ data: BackupJob[]; total: number }, Error>({
    queryKey: ["dumps", "history"],
    queryFn: fetchDumpsHistory,
    staleTime: 30_000,
  });

  const allDumps = query.data?.data ?? [];
  const serverTotal = query.data?.total ?? 0;

  const filtered = useMemo(
    () => filterDumps(allDumps, filters),
    [allDumps, filters],
  );

  const isFiltered = hasActiveFilters(filters);
  const dumps = isFiltered ? filtered : filtered.slice(0, DEFAULT_LIMIT);

  const applyFilters = useCallback((newFilters: DumpsFilters) => {
    const cleaned: DumpsFilters = {};
    if (newFilters.connectionId) cleaned.connectionId = newFilters.connectionId;
    if (newFilters.environment) cleaned.environment = newFilters.environment;
    if (newFilters.status) cleaned.status = newFilters.status;
    if (newFilters.from) cleaned.from = newFilters.from;
    if (newFilters.to) cleaned.to = newFilters.to;
    setFilters(cleaned);
  }, []);

  const resetFilters = useCallback(() => setFilters({}), []);

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    dumps,
    total: isFiltered ? filtered.length : serverTotal,
    isLoading: query.isLoading,
    error: query.error,
    filters,
    applyFilters,
    resetFilters,
    refetch,
  };
}
