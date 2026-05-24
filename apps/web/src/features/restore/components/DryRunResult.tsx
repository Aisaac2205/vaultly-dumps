import type { DryRunResult as DryRunResultType } from "../types";
import { Button } from "@/shared/ui/button";
import { formatNumber } from "../lib/format";

const MAX_VISIBLE_TABLES = 10;

interface DryRunResultProps {
  result: DryRunResultType;
  onConfirm: () => void;
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

  if (!diff || !source) {
    return <TargetOnlyView target={target} onConfirm={onConfirm} onCancel={onCancel} isLoading={isLoading} />;
  }

  return (
    <div className="space-y-4">
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

      <div className="overflow-hidden rounded-xl bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tabla
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Source
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Target
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Delta
              </th>
            </tr>
          </thead>
          <tbody>
            {diff.added.slice(0, MAX_VISIBLE_TABLES).map((name) => (
              <tr key={name} className="border-t border-border/20 bg-emerald-500/5">
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
            {diff.common.slice(0, MAX_VISIBLE_TABLES).map((t) => {
              const delta = t.sourceRows - t.targetRows;
              return (
                <tr key={t.name} className="border-t border-border/20 hover:bg-muted/40">
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
            {diff.removed.slice(0, MAX_VISIBLE_TABLES).map((name) => (
              <tr key={name} className="border-t border-border/20 bg-red-500/5">
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
            {totalOverflow(diff) > 0 && (
              <tr className="border-t border-border/20">
                <td colSpan={4} className="px-3 py-2.5 text-xs text-muted-foreground">
                  +{totalOverflow(diff)} more
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={onCancel} disabled={isLoading} variant="outline">
          Cancelar
        </Button>
        <Button onClick={onConfirm} disabled={isLoading} variant="destructive">
          {isLoading ? "Procesando\u2026" : "Confirmar restore real"}
        </Button>
      </div>
    </div>
  );
}

function TargetOnlyView({
  target,
  onConfirm,
  onCancel,
  isLoading,
}: {
  target: DryRunResultType["target"];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const visibleTables = target.tables.slice(0, MAX_VISIBLE_TABLES);
  const remaining = target.tables.length - MAX_VISIBLE_TABLES;

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <span className="text-xs text-amber-600">(manifest no disponible)</span>{" "}
        Destino actual:{" "}
        <span className="font-mono font-semibold">
          {target.tableCount} tablas, ~{formatNumber(target.estimatedRows)} filas
        </span>
      </p>

      <div className="overflow-hidden rounded-xl bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tabla
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Filas estimadas
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleTables.map((table) => (
              <tr key={table.name} className="border-t border-border/20 hover:bg-muted/40">
                <td className="px-3 py-2.5">{table.name}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs">
                  {formatNumber(table.estimatedRows)}
                </td>
              </tr>
            ))}
            {remaining > 0 && (
              <tr className="border-t border-border/20">
                <td colSpan={2} className="px-3 py-2.5 text-xs text-muted-foreground">
                  +{remaining} more
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={onCancel} disabled={isLoading} variant="outline">
          Cancelar
        </Button>
        <Button onClick={onConfirm} disabled={isLoading} variant="destructive">
          {isLoading ? "Procesando\u2026" : "Confirmar restore real"}
        </Button>
      </div>
    </div>
  );
}

function totalOverflow(diff: NonNullable<DryRunResultType["diff"]>): number {
  const total = diff.added.length + diff.common.length + diff.removed.length;
  return Math.max(0, total - MAX_VISIBLE_TABLES * 3);
}
