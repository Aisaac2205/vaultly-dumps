import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Filters } from "@/shared/ui/filters";
import type { Cronjob, JobStatus } from "../types";

export interface CronjobFiltersState {
  search: string;
  status: string;
  active: string;
}

interface CronjobFiltersProps {
  filters: CronjobFiltersState;
  onChange: (filters: CronjobFiltersState) => void;
}


function filtersToRecord(f: CronjobFiltersState): Record<string, string> {
  const r: Record<string, string> = {};
  if (f.search) r.search = f.search;
  if (f.status) r.status = f.status;
  if (f.active) r.active = f.active;
  return r;
}

function recordToFilters(r: Record<string, string>): CronjobFiltersState {
  return {
    search: r.search ?? "",
    status: r.status ?? "",
    active: r.active ?? "",
  };
}

export function CronjobFilters({
  filters,
  onChange,
}: CronjobFiltersProps) {
  const { t } = useTranslation("cronjobs");

  const STATUS_OPTIONS = [
    { value: "", label: t("filter.allStatuses") },
    { value: "pending", label: t("filter.statusPending") },
    { value: "running", label: t("filter.statusRunning") },
    { value: "completed", label: t("filter.statusCompleted") },
    { value: "failed", label: t("filter.statusFailed") },
  ];

  const ACTIVE_OPTIONS = [
    { value: "", label: t("filter.all") },
    { value: "active", label: t("filter.activeOnly") },
    { value: "inactive", label: t("filter.inactiveOnly") },
  ];

  const handleFiltersChange = useCallback(
    (next: Record<string, string>) => {
      onChange(recordToFilters(next));
    },
    [onChange],
  );

  return (
    <Filters.Root
      filters={filtersToRecord(filters)}
      onFiltersChange={handleFiltersChange}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Filters.Trigger />
        <Filters.ActiveChips className="flex-1" />
      </div>
      <Filters.Popover>
        <Filters.Search
          filterKey="search"
          label={t("filter.searchLabel")}
          placeholder={t("filter.searchPlaceholder")}
        />
        <Filters.Select
          filterKey="status"
          label={t("filter.status")}
          options={STATUS_OPTIONS}
          placeholder={t("filter.allStatuses")}
        />
        <Filters.Select
          filterKey="active"
          label={t("filter.active")}
          options={ACTIVE_OPTIONS}
          placeholder={t("filter.all")}
        />
      </Filters.Popover>
    </Filters.Root>
  );
}

// ─── Filter Hook ───────────────────────────────────────────

export function useCronjobFilters(cronjobs: Cronjob[]) {
  const [filters, setFilters] = useState<CronjobFiltersState>({
    search: "",
    status: "",
    active: "",
  });

  const filtered = useMemo(() => {
    let result = cronjobs;

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.connectionName ?? "").toLowerCase().includes(q),
      );
    }

    if (filters.status) {
      result = result.filter(
        (c) => c.lastStatus === (filters.status as JobStatus),
      );
    }

    if (filters.active === "active") {
      result = result.filter((c) => c.isActive);
    } else if (filters.active === "inactive") {
      result = result.filter((c) => !c.isActive);
    }

    return result;
  }, [cronjobs, filters]);

  return { filters, setFilters, filtered };
}
