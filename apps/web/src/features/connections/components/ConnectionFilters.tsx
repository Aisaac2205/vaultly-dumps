import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Filters, type FilterOption } from "@/shared/ui/filters";
import type { Connection } from "../types";

export interface ConnectionFiltersState {
  search: string;
  environment: string;
  dbType: string;
  status: string;
}

interface ConnectionFiltersProps {
  filters: ConnectionFiltersState;
  onChange: (filters: ConnectionFiltersState) => void;
}

// ─── State Mappers ────────────────────────────────────────

function toRecord(f: ConnectionFiltersState): Record<string, string> {
  const r: Record<string, string> = {};
  if (f.search) r.search = f.search;
  if (f.environment) r.environment = f.environment;
  if (f.dbType) r.dbType = f.dbType;
  if (f.status) r.status = f.status;
  return r;
}

function fromRecord(r: Record<string, string>): ConnectionFiltersState {
  return {
    search: r.search ?? "",
    environment: r.environment ?? "",
    dbType: r.dbType ?? "",
    status: r.status ?? "",
  };
}

// ─── Component ────────────────────────────────────────────

export function ConnectionFilters({
  filters,
  onChange,
}: ConnectionFiltersProps) {
  const { t } = useTranslation("connections");

  const ENVIRONMENT_OPTIONS: FilterOption[] = [
    { value: "dev", label: "dev" },
    { value: "qa", label: "qa" },
    { value: "prod", label: "prod" },
  ];

  const DB_TYPE_OPTIONS: FilterOption[] = [
    { value: "postgres", label: "PostgreSQL" },
    { value: "mysql", label: "MySQL" },
  ];

  const STATUS_OPTIONS: FilterOption[] = [
    { value: "active", label: t("filter.active") },
    { value: "inactive", label: t("filter.inactive") },
  ];

  const handleChange = (recordFilters: Record<string, string>) => {
    onChange(fromRecord(recordFilters));
  };

  return (
    <Filters.Root
      filters={toRecord(filters)}
      onFiltersChange={handleChange}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:min-w-[220px] sm:w-auto sm:flex-1">
          <Filters.Search
            filterKey="search"
            placeholder={t("filter.searchPlaceholder")}
          />
        </div>
        <Filters.Trigger />
        <Filters.ActiveChips className="flex-1" />
      </div>
      <Filters.Popover>
        <Filters.Select
          filterKey="environment"
          label={t("filter.environment")}
          options={ENVIRONMENT_OPTIONS}
          placeholder={t("filter.allEnvironments")}
        />
        <Filters.Select
          filterKey="dbType"
          label={t("filter.dbType")}
          options={DB_TYPE_OPTIONS}
          placeholder={t("filter.allTypes")}
        />
        <Filters.Select
          filterKey="status"
          label={t("filter.status")}
          options={STATUS_OPTIONS}
          placeholder={t("filter.allStatuses")}
        />
      </Filters.Popover>
    </Filters.Root>
  );
}

// ─── Filter Hook ───────────────────────────────────────────

export function useConnectionFilters(connections: Connection[]) {
  const [filters, setFilters] = useState<ConnectionFiltersState>({
    search: "",
    environment: "",
    dbType: "",
    status: "",
  });

  const filtered = useMemo(() => {
    let result = connections;

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.host.toLowerCase().includes(q) ||
          c.database.toLowerCase().includes(q),
      );
    }

    if (filters.environment) {
      result = result.filter((c) => c.environment === filters.environment);
    }

    if (filters.dbType) {
      result = result.filter((c) => c.dbType === filters.dbType);
    }

    if (filters.status === "active") {
      result = result.filter((c) => c.isActive);
    } else if (filters.status === "inactive") {
      result = result.filter((c) => !c.isActive);
    }

    return result;
  }, [connections, filters]);

  return { filters, setFilters, filtered };
}
