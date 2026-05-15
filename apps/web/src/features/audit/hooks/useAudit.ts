import { useState, useEffect, useCallback } from "react";
import type { AuditLog, AuditFilters } from "../types";
import apiClient from "../../../shared/lib/api-client";

const DEFAULT_LIMIT = 10;

interface UseAuditReturn {
  logs: AuditLog[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  applyFilters: (filters: AuditFilters) => void;
  resetFilters: () => void;
}

function hasActiveFilters(filters: AuditFilters): boolean {
  return !!(
    filters.userId ||
    filters.username ||
    filters.environment ||
    filters.resourceType ||
    filters.from ||
    filters.to
  );
}

export function useAudit(): UseAuditReturn {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<AuditFilters>({});

  const fetchLogs = useCallback(async (activeFilters: AuditFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = {};
      if (activeFilters.userId) params.userId = activeFilters.userId;
      if (activeFilters.username) params.username = activeFilters.username;
      if (activeFilters.environment) params.environment = activeFilters.environment;
      if (activeFilters.resourceType) params.resourceType = activeFilters.resourceType;
      if (activeFilters.from) params.from = activeFilters.from;
      if (activeFilters.to) params.to = activeFilters.to;

      const response = await apiClient.get<AuditLog[]>("/audit", { params });

      const allLogs = Array.isArray(response.data) ? response.data : [];
      const isFiltered = hasActiveFilters(activeFilters);

      setLogs(isFiltered ? allLogs : allLogs.slice(0, DEFAULT_LIMIT));
      setTotal(allLogs.length);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error al cargar los registros de auditoría"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = useCallback(
    (newFilters: AuditFilters) => {
      const cleaned: AuditFilters = {};
      if (newFilters.userId) cleaned.userId = newFilters.userId;
      if (newFilters.username) cleaned.username = newFilters.username;
      if (newFilters.environment) cleaned.environment = newFilters.environment;
      if (newFilters.resourceType) cleaned.resourceType = newFilters.resourceType;
      if (newFilters.from) cleaned.from = newFilters.from;
      if (newFilters.to) cleaned.to = newFilters.to;

      setFilters(cleaned);
      fetchLogs(cleaned);
    },
    [fetchLogs],
  );

  const resetFilters = useCallback(() => {
    setFilters({});
    fetchLogs({});
  }, [fetchLogs]);

  return { logs, total, isLoading, error, applyFilters, resetFilters };
}
