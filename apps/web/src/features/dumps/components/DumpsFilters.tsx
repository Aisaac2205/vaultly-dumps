import { useState, useCallback, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import type { DumpsFilters, JobStatus } from "../types";

interface DumpsFiltersProps {
  filters: DumpsFilters;
  connections: { id: string; name: string }[];
  onApply: (filters: DumpsFilters) => void;
  onReset: () => void;
}

export default function DumpsFilters({ filters, connections, onApply, onReset }: DumpsFiltersProps) {
  const [connectionId, setConnectionId] = useState(filters.connectionId ?? "");
  const [environment, setEnvironment] = useState(filters.environment ?? "");
  const [status, setStatus] = useState(filters.status ?? "");
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      onApply({
        connectionId: connectionId || undefined,
        environment: environment || undefined,
        status: (status as JobStatus) || undefined,
        from: from || undefined,
        to: to || undefined,
      });
    },
    [connectionId, environment, status, from, to, onApply],
  );

  const handleReset = useCallback(() => {
    setConnectionId("");
    setEnvironment("");
    setStatus("");
    setFrom("");
    setTo("");
    onReset();
  }, [onReset]);

  const inputBase =
    "flex h-9 w-full min-w-[160px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dumps-connection" className="text-xs font-medium text-muted-foreground">
              Conexión
            </label>
            <select
              id="dumps-connection"
              value={connectionId}
              onChange={(e) => setConnectionId(e.target.value)}
              className={inputBase}
            >
              <option value="">Todas</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="dumps-env" className="text-xs font-medium text-muted-foreground">
              Ambiente
            </label>
            <select
              id="dumps-env"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className={inputBase}
            >
              <option value="">Todos</option>
              <option value="prod">prod</option>
              <option value="dev">dev</option>
              <option value="sqa">sqa</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="dumps-status" className="text-xs font-medium text-muted-foreground">
              Estado
            </label>
            <select
              id="dumps-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputBase}
            >
              <option value="">Todos</option>
              <option value="completed">Completado</option>
              <option value="running">En progreso</option>
              <option value="pending">Pendiente</option>
              <option value="failed">Fallido</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="dumps-from" className="text-xs font-medium text-muted-foreground">
              Desde
            </label>
            <input
              id="dumps-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputBase}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="dumps-to" className="text-xs font-medium text-muted-foreground">
              Hasta
            </label>
            <input
              id="dumps-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputBase}
            />
          </div>

          <div className="flex gap-2 ml-auto">
            <Button type="submit" variant="default" size="sm">
              <Search className="h-4 w-4" />
              Aplicar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleReset}>
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
