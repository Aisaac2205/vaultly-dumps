import { Shield } from "lucide-react";
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

        {/* Custom Toggle */}
        <div className="relative">
          <input
            id="dry-run"
            type="checkbox"
            className="peer sr-only"
            checked={isDryRun}
            onChange={(e) => onDryRunChange(e.target.checked)}
            disabled={disabled}
          />
          <div
            className={cn(
              "h-6 w-11 cursor-pointer rounded-full border-2 border-transparent transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              isDryRun ? "bg-primary" : "bg-input",
            )}
            onClick={() => !disabled && onDryRunChange(!isDryRun)}
          >
            <div className="relative h-full w-full">
              {/* Knob */}
              <div
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow-lg transition-transform",
                  isDryRun ? "translate-x-5" : "translate-x-0",
                )}
              >
                {/* Bar inside knob */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={cn(
                      "h-0.5 w-2 rounded-full transition-colors",
                      isDryRun ? "bg-primary" : "bg-muted-foreground",
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
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
