import { Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";

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
        <button
          type="button"
          role="switch"
          aria-checked={isDryRun}
          id="dry-run"
          disabled={disabled}
          onClick={() => onDryRunChange(!isDryRun)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            isDryRun ? "bg-primary" : "bg-input",
          )}
        >
          <span
            className={cn(
              "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
              isDryRun ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
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
