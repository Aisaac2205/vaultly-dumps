import { Play, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface RestoreActionsProps {
  canSimulate: boolean;
  canExecute: boolean;
  isLoading: boolean;
  onSimulate: () => void;
  onExecute: () => void;
}

export function RestoreActions({
  canSimulate,
  canExecute,
  isLoading,
  onSimulate,
  onExecute,
}: RestoreActionsProps) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          onClick={onSimulate}
          disabled={isLoading || !canSimulate}
          className="flex-1"
        >
          <Play className="mr-2 h-4 w-4" />
          {isLoading ? "Procesando..." : "Simular restore"}
        </Button>

        <Button
          onClick={onExecute}
          disabled={isLoading || !canExecute}
          variant="ghost"
          className="flex-1 text-red-500 hover:bg-red-500/10 hover:text-red-600"
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          {isLoading ? "Procesando..." : "Restaurar (real)"}
        </Button>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        <span>
          Se recomienda un Dry Run antes de restaurar.
        </span>
      </div>
    </div>
  );
}
