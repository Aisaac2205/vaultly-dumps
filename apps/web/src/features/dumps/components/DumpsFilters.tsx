import { useCallback, useMemo } from "react";
import { Filters } from "@/shared/ui/filters";
import type { DumpsFilters, JobStatus } from "../types";

interface DumpsFiltersProps {
  filters: DumpsFilters;
  connections: { id: string; name: string }[];
  onApply: (filters: DumpsFilters) => void;
  onReset: () => void;
}

const ENV_OPTIONS = [
  { value: "prod", label: "prod" },
  { value: "dev", label: "dev" },
  { value: "qa", label: "qa" },
];

const STATUS_OPTIONS = [
  { value: "completed", label: "Completado" },
  { value: "running", label: "En progreso" },
  { value: "pending", label: "Pendiente" },
  { value: "failed", label: "Fallido" },
];

function filtersToRecord(f: DumpsFilters): Record<string, string> {
  const r: Record<string, string> = {};
  if (f.connectionId) r.connectionId = f.connectionId;
  if (f.environment) r.environment = f.environment;
  if (f.status) r.status = f.status;
  if (f.from) r.from = f.from;
  if (f.to) r.to = f.to;
  return r;
}

function recordToFilters(r: Record<string, string>): DumpsFilters {
  return {
    connectionId: r.connectionId || undefined,
    environment: r.environment || undefined,
    status: (r.status as JobStatus) || undefined,
    from: r.from || undefined,
    to: r.to || undefined,
  };
}

export default function DumpsFilters({
  filters,
  connections,
  onApply,
  onReset,
}: DumpsFiltersProps) {
  const connectionOptions = useMemo(
    () =>
      connections.map((c) => ({ value: c.id, label: c.name })),
    [connections],
  );

  const handleFiltersChange = useCallback(
    (next: Record<string, string>) => {
      const converted = recordToFilters(next);
      if (Object.keys(next).length === 0) {
        onReset();
      } else {
        onApply(converted);
      }
    },
    [onApply, onReset],
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
        <Filters.Select
          filterKey="connectionId"
          label="Conexión"
          options={connectionOptions}
          placeholder="Todas"
        />
        <Filters.Select
          filterKey="environment"
          label="Ambiente"
          options={ENV_OPTIONS}
          placeholder="Todos"
        />
        <Filters.Select
          filterKey="status"
          label="Estado"
          options={STATUS_OPTIONS}
          placeholder="Todos"
        />
        <Filters.DateRange filterKey="from" label="Desde" />
        <Filters.DateRange filterKey="to" label="Hasta" />
      </Filters.Popover>
    </Filters.Root>
  );
}
