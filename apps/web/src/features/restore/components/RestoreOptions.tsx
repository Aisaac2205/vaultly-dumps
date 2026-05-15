import { Shield } from "lucide-react";

interface RestoreOptionsProps {
  isDryRun: boolean;
  onDryRunChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function RestoreOptions({
  isDryRun,
  onDryRunChange,
  disabled = false,
}: RestoreOptionsProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          id="dry-run"
          className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          checked={isDryRun}
          onChange={(e) => onDryRunChange(e.target.checked)}
          disabled={disabled}
        />
        <div>
          <label
            htmlFor="dry-run"
            className="cursor-pointer select-none text-sm font-medium"
          >
            Dry Run (simular sin modificar datos)
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Analiza las tablas y filas que se verían afectadas sin ejecutar
            cambios reales.
          </p>
        </div>
      </div>

      {!isDryRun && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-2.5 text-sm text-red-600 dark:text-red-400">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Esto ejecutará un restore <strong>REAL</strong> sobre la base de
            datos destino. Los datos existentes serán modificados.
          </p>
        </div>
      )}
    </div>
  );
}
