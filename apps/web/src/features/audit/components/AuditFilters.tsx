import { useState, useCallback, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import type { AuditFilters } from "../types";

interface AuditFiltersProps {
  filters: AuditFilters;
  onApply: (filters: AuditFilters) => void;
  onReset: () => void;
}

export default function AuditFilters({ filters, onApply, onReset }: AuditFiltersProps) {
  const [username, setUsername] = useState(filters.username ?? "");
  const [environment, setEnvironment] = useState(filters.environment ?? "");
  const [resourceType, setResourceType] = useState(filters.resourceType ?? "");
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      onApply({
        username: username || undefined,
        environment: environment || undefined,
        resourceType: resourceType || undefined,
        from: from || undefined,
        to: to || undefined,
      });
    },
    [username, environment, resourceType, from, to, onApply],
  );

  const handleReset = useCallback(() => {
    setUsername("");
    setEnvironment("");
    setResourceType("");
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
            <label htmlFor="audit-username" className="text-xs font-medium text-muted-foreground">
              Usuario
            </label>
            <input
              id="audit-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="nombre.usuario"
              className={inputBase}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="audit-env" className="text-xs font-medium text-muted-foreground">
              Ambiente
            </label>
            <select
              id="audit-env"
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
            <label htmlFor="audit-resource" className="text-xs font-medium text-muted-foreground">
              Recurso
            </label>
            <select
              id="audit-resource"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className={inputBase}
            >
              <option value="">Todos</option>
              <option value="backup">backup</option>
              <option value="restore">restore</option>
              <option value="connection">connection</option>
              <option value="cronjob">cronjob</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="audit-from" className="text-xs font-medium text-muted-foreground">
              Desde
            </label>
            <input
              id="audit-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputBase}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="audit-to" className="text-xs font-medium text-muted-foreground">
              Hasta
            </label>
            <input
              id="audit-to"
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
