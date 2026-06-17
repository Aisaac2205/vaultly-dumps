import { Shield, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface RestoreActionsProps {
  canSimulate: boolean;
  canExecute: boolean;
  isDryRun: boolean;
  isLoading: boolean;
  onSimulate: () => void;
  onExecute: () => void;
}

export function RestoreActions({
  canSimulate,
  canExecute,
  isDryRun,
  isLoading,
  onSimulate,
  onExecute,
}: RestoreActionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button
          onClick={onSimulate}
          disabled={isLoading || !canSimulate || !isDryRun}
          className="flex-1"
          variant="outline"
        >
          <Play className="mr-2 h-4 w-4" />
          {isLoading && isDryRun ? "Procesando..." : "Simular Restauración"}
        </Button>

        <Button
          onClick={onExecute}
          disabled={isLoading || !canExecute || isDryRun}
          variant="destructive"
          className="flex-1"
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          {isLoading && !isDryRun ? "Procesando..." : "Restaurar (real)"}
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5 shrink-0" />
        <span>Se recomienda un Dry Run antes de restaurar.</span>
      </div>
    </div>
  );
}
