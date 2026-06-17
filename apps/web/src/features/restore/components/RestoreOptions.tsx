import { Shield } from "lucide-react";
import { LeverSwitch } from "@/shared/ui/lever-switch";

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
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
        <div>
          <label
            htmlFor="dry-run"
            className="cursor-pointer select-none text-sm font-medium"
          >
            Dry Run
          </label>
          <p className="text-xs text-muted-foreground">
            Simular sin modificar datos
          </p>
        </div>

        <LeverSwitch
          id="dry-run"
          checked={isDryRun}
          onChange={onDryRunChange}
          disabled={disabled}
        />
      </div>

      {!isDryRun && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
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
