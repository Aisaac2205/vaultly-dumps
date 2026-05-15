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
  const visibleTables = result.tables.slice(0, MAX_VISIBLE_TABLES);
  const remaining = result.tables.length - MAX_VISIBLE_TABLES;

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Resultado del dry run:{" "}
        <span className="font-mono font-semibold">
          {result.tableCount} tablas, ~{formatNumber(result.estimatedRows)}{" "}
          filas
        </span>{" "}
        estimadas
      </p>

      <div className="overflow-hidden rounded-xl border border-border/50">
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
              <tr
                key={table.name}
                className="border-t border-border/20 hover:bg-muted/40"
              >
                <td className="px-3 py-2.5">{table.name}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs">
                  {formatNumber(table.estimatedRows)}
                </td>
              </tr>
            ))}
            {remaining > 0 && (
              <tr className="border-t border-border/20">
                <td
                  colSpan={2}
                  className="px-3 py-2.5 text-xs text-muted-foreground"
                >
                  +{remaining} más
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
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          variant="destructive"
        >
          {isLoading ? "Procesando…" : "Confirmar restore real"}
        </Button>
      </div>
    </div>
  );
}
