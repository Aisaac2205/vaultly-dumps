import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AuditLog, AuditFilters } from "../types";
import apiClient from "../../../shared/lib/api-client";

const DEFAULT_PAGE_SIZE = 25;

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseAuditReturn {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: Error | null;
  filters: AuditFilters;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  applyFilters: (filters: AuditFilters) => void;
  resetFilters: () => void;
  refetch: () => Promise<void>;
}

async function fetchAuditLogs(
  page: number,
  pageSize: number,
  filters: AuditFilters,
): Promise<{ data: AuditLog[]; total: number }> {
  const params: Record<string, string | number> = {
    page,
    pageSize,
  };

  if (filters.userId) params.userId = filters.userId;
  if (filters.username) params.username = filters.username;
  if (filters.environment) params.environment = filters.environment;
  if (filters.resourceType) params.resourceType = filters.resourceType;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;

  const response = await apiClient.get<PaginatedResponse<AuditLog>>("/audit", {
    params,
  });

  return {
    data: response.data.data,
    total: response.data.total,
  };
}

export function useAudit(): UseAuditReturn {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState<AuditFilters>({});

  const query = useQuery<{ data: AuditLog[]; total: number }, Error>({
    queryKey: ["audit", "logs", page, pageSize, filters],
    queryFn: () => fetchAuditLogs(page, pageSize, filters),
    staleTime: 30_000,
  });

  const applyFilters = useCallback((newFilters: AuditFilters) => {
    setPage(1);
    const cleaned: AuditFilters = {};
    if (newFilters.userId) cleaned.userId = newFilters.userId;
    if (newFilters.username) cleaned.username = newFilters.username;
    if (newFilters.environment) cleaned.environment = newFilters.environment;
    if (newFilters.resourceType) cleaned.resourceType = newFilters.resourceType;
    if (newFilters.from) cleaned.from = newFilters.from;
    if (newFilters.to) cleaned.to = newFilters.to;
    setFilters(cleaned);
  }, []);

  const resetFilters = useCallback(() => {
    setPage(1);
    setFilters({});
  }, []);

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    logs: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    page,
    pageSize,
    isLoading: query.isLoading,
    error: query.error,
    filters,
    setPage,
    setPageSize,
    applyFilters,
    resetFilters,
    refetch,
  };
}
