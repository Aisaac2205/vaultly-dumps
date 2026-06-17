import type { DryRunResult as DryRunResultType, DryRunConnectionInfo } from "../types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { formatNumber } from "../lib/format";
import postgresSvg from "@/shared/assets/PostgresSQL.svg";
import mysqlSvg from "@/shared/assets/MySQL.svg";
import { Check, X } from "lucide-react";
import { useState } from "react";

const DB_LOGOS: Record<string, string> = {
  postgres: postgresSvg as string,
  mysql: mysqlSvg as string,
};

const DB_LABELS: Record<string, string> = {
  postgres: "PostgreSQL",
  mysql: "MySQL",
};

function ConnectionCard({ conn, label }: { conn: DryRunConnectionInfo; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 px-3 py-2">
      {DB_LOGOS[conn.dbType] && (
        <img
          src={DB_LOGOS[conn.dbType]}
          alt={DB_LABELS[conn.dbType] ?? conn.dbType}
          className="h-5 w-5 shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold" title={conn.name}>{conn.name}</p>
        <p className="truncate font-mono text-xs text-muted-foreground" title={conn.database}>{conn.database}</p>
      </div>
      <Badge variant="outline" className="shrink-0 rounded-full text-[10px] uppercase">
        {conn.environment}
      </Badge>
    </div>
  );
}

interface DryRunResultProps {
  result: DryRunResultType;
  onConfirm: (excludedTables: string[]) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function DryRunResult({
  result,
  onConfirm,
  onCancel,
  isLoading,
}: DryRunResultProps) {
  const { source, target, diff } = result;
  const [excludedTables, setExcludedTables] = useState<Set<string>>(new Set());

  function toggleTable(name: string) {
    setExcludedTables((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  if (!diff || !source) {
    return <TargetOnlyView target={target} targetConnection={result.targetConnection} onConfirm={() => onConfirm([])} onCancel={onCancel} isLoading={isLoading} />;
  }

  return (
    <div className="space-y-4">
      {/* Connection info */}
      <div className="grid gap-3 sm:grid-cols-2">
        {result.sourceConnection && (
          <ConnectionCard conn={result.sourceConnection} label="Source" />
        )}
        <ConnectionCard conn={result.targetConnection} label="Target" />
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex-1 rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dump (source)</p>
          <p className="font-mono font-semibold">
            {source.tableCount} tablas, ~{formatNumber(source.estimatedRows)} filas
          </p>
        </div>
        <div className="flex-1 rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Destino (target)</p>
          <p className="font-mono font-semibold">
            {target.tableCount} tablas, ~{formatNumber(target.estimatedRows)} filas
          </p>
        </div>
      </div>

      <div className="max-h-[60dvh] overflow-auto rounded-xl bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
            <tr>
              <th className="w-10 px-3 py-2.5"></th>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tabla
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {result.sourceConnection?.environment?.toUpperCase() ?? "Source"}
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {result.targetConnection.environment.toUpperCase()}
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Diferencia
              </th>
            </tr>
          </thead>
          <tbody>
            {diff.added.map((name) => (
              <tr key={name} className="border-t border-border/20 bg-emerald-500/5">
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleTable(name)}
                    className="flex h-5 w-5 items-center justify-center rounded border border-border bg-background hover:bg-accent"
                    aria-label={`Excluir tabla ${name}`}
                  >
                    {excludedTables.has(name) ? (
                      <X className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Check className="h-3 w-3 text-transparent" />
                    )}
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  <span className="mr-1.5 text-xs text-emerald-600">+</span>{name}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs">
                  {formatNumber(source.tables.find((t) => t.name === name)?.estimatedRows ?? 0)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">—</td>
                <td className="px-3 py-2.5 text-right text-xs text-emerald-600">new</td>
              </tr>
            ))}
            {diff.common.map((t) => {
              const delta = t.sourceRows - t.targetRows;
              const isExcluded = excludedTables.has(t.name);
              return (
                <tr key={t.name} className={`border-t border-border/20 hover:bg-muted/40 ${isExcluded ? "opacity-40" : ""}`}>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleTable(t.name)}
                      className="flex h-5 w-5 items-center justify-center rounded border border-border bg-background hover:bg-accent"
                      aria-label={`Excluir tabla ${t.name}`}
                    >
                      {isExcluded ? (
                        <X className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Check className="h-3 w-3 text-transparent" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">{t.name}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">
                    {formatNumber(t.sourceRows)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">
                    {formatNumber(t.targetRows)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono text-xs ${delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                    {delta > 0 ? `+${formatNumber(delta)}` : delta < 0 ? formatNumber(delta) : "="}
                  </td>
                </tr>
              );
            })}
            {diff.removed.map((name) => (
              <tr key={name} className="border-t border-border/20 bg-red-500/5">
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleTable(name)}
                    className="flex h-5 w-5 items-center justify-center rounded border border-border bg-background hover:bg-accent"
                    aria-label={`Excluir tabla ${name}`}
                  >
                    {excludedTables.has(name) ? (
                      <X className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Check className="h-3 w-3 text-transparent" />
                    )}
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  <span className="mr-1.5 text-xs text-red-500">−</span>{name}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">—</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs">
                  {formatNumber(target.tables.find((t) => t.name === name)?.estimatedRows ?? 0)}
                </td>
                <td className="px-3 py-2.5 text-right text-xs text-red-500">drop</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">
          {excludedTables.size > 0
            ? `${excludedTables.size} tabla(s) excluida(s)`
            : "Todas las tablas serán restauradas"}
        </span>
        <div className="flex gap-3">
          <Button onClick={onCancel} disabled={isLoading} variant="ghost">
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(Array.from(excludedTables))} disabled={isLoading} className="bg-black text-white hover:bg-black/90">
            {isLoading ? "Procesando…" : "Confirmar restore"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TargetOnlyView({
  target,
  targetConnection,
  onConfirm,
  onCancel,
  isLoading,
}: {
  target: DryRunResultType["target"];
  targetConnection: DryRunResultType["targetConnection"];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <ConnectionCard conn={targetConnection} label="Target" />

      <p className="text-sm">
        <span className="text-xs text-amber-600">(manifest no disponible)</span>{" "}
        Destino actual:{" "}
        <span className="font-mono font-semibold">
          {target.tableCount} tablas, ~{formatNumber(target.estimatedRows)} filas
        </span>
      </p>

      <div className="max-h-[60dvh] overflow-auto rounded-xl bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tabla
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Filas estimadas
              </th>
            </tr>
          </thead>
          <tbody>
            {target.tables.map((table) => (
              <tr key={table.name} className="border-t border-border/20 hover:bg-muted/40">
                <td className="px-3 py-2.5">{table.name}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs">
                  {formatNumber(table.estimatedRows)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={onCancel} disabled={isLoading} variant="ghost">
          Cancelar
        </Button>
        <Button onClick={onConfirm} disabled={isLoading} className="bg-black text-white hover:bg-black/90">
          {isLoading ? "Procesando…" : "Confirmar restore"}
        </Button>
      </div>
    </div>
  );
}
