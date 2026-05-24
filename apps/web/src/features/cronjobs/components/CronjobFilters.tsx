import { useState, useMemo, useEffect } from "react";
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

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "running", label: "En progreso" },
  { value: "completed", label: "Completado" },
  { value: "failed", label: "Fallido" },
];

const ACTIVE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
];

export function CronjobFilters({
  filters,
  onChange,
}: CronjobFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce search by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ ...filters, search: searchInput });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync external filter changes to searchInput
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const inputClass =
    "rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <input
        type="text"
        placeholder="Buscar por nombre o conexión..."
        className={`w-full sm:min-w-[220px] sm:w-auto sm:flex-1 ${inputClass}`}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      <select
        className={inputClass}
        value={filters.status}
        onChange={(e) =>
          onChange({ ...filters, status: e.target.value })
        }
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        className={inputClass}
        value={filters.active}
        onChange={(e) =>
          onChange({ ...filters, active: e.target.value })
        }
      >
        {ACTIVE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
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
