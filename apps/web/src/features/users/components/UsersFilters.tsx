import { useCallback, useState } from "react";
import { Filters } from "@/shared/ui/filters";
import type { UserRole } from "../types";

export interface UserFiltersState {
  search: string;
  role: "" | UserRole;
}

interface UsersFiltersProps {
  filters: UserFiltersState;
  onChange: (filters: UserFiltersState) => void;
}

const ROLE_OPTIONS = [
  { value: "", label: "Todos los roles" },
  { value: "admin", label: "Administradores" },
  { value: "user", label: "Usuarios" },
];

function filtersToRecord(f: UserFiltersState): Record<string, string> {
  const r: Record<string, string> = {};
  if (f.search) r.search = f.search;
  if (f.role) r.role = f.role;
  return r;
}

function recordToFilters(r: Record<string, string>): UserFiltersState {
  return {
    search: r.search ?? "",
    role: (r.role ?? "") as "" | UserRole,
  };
}

export function UsersFilters({ filters, onChange }: UsersFiltersProps) {
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
          label="Buscar"
          placeholder="Nombre..."
        />
        <Filters.Select
          filterKey="role"
          label="Rol"
          options={ROLE_OPTIONS}
          placeholder="Todos los roles"
        />
      </Filters.Popover>
    </Filters.Root>
  );
}

export function useUserFilters() {
  const [filters, setFilters] = useState<UserFiltersState>({
    search: "",
    role: "",
  });
  return { filters, setFilters };
}
