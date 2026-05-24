import { useState, useMemo, useEffect } from "react";
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

export function ConnectionFilters({
  filters,
  onChange,
}: ConnectionFiltersProps) {
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
        placeholder="Buscar por nombre, host o BD..."
        className={`w-full sm:min-w-[220px] sm:w-auto sm:flex-1 ${inputClass}`}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      <select
        className={inputClass}
        value={filters.environment}
        onChange={(e) =>
          onChange({ ...filters, environment: e.target.value })
        }
      >
        <option value="">Todos los ambientes</option>
        <option value="dev">dev</option>
        <option value="sqa">sqa</option>
        <option value="prod">prod</option>
      </select>

      <select
        className={inputClass}
        value={filters.dbType}
        onChange={(e) => onChange({ ...filters, dbType: e.target.value })}
      >
        <option value="">Todos los tipos</option>
        <option value="postgres">PostgreSQL</option>
        <option value="mysql">MySQL</option>
      </select>

      <select
        className={inputClass}
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
      >
        <option value="">Todos los estados</option>
        <option value="active">Activas</option>
        <option value="inactive">Inactivas</option>
      </select>
    </div>
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
