import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { StatusBadge } from "@/shared/ui/status-badge";

type RestoreProgressStatus = "running" | "completed" | "failed";

interface RestoreProgressProps {
  jobId: string;
  status: RestoreProgressStatus;
  progress?: number; // 0-100
}

export function RestoreProgress({ jobId, status, progress = 0 }: RestoreProgressProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <span className="font-mono text-xs text-muted-foreground">
            Job: {jobId.slice(0, 8)}...
          </span>
        </div>
        {status === "running" && (
          <span className="font-mono text-sm font-medium text-foreground">
            {progress}%
          </span>
        )}
      </div>

      {status === "running" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Restaurando base de datos...</p>
              <p className="text-xs text-muted-foreground">
                Esto puede tardar unos segundos. No cierres esta ventana.
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === "completed" && (
        <div className="flex items-center gap-3 rounded-lg bg-green-500/10 p-4 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-medium">Restore completado exitosamente.</p>
        </div>
      )}

      {status === "failed" && (
        <div className="flex items-center gap-3 rounded-lg bg-red-500/10 p-4 text-red-600 dark:text-red-400">
          <XCircle className="h-5 w-5" />
          <p className="text-sm font-medium">El restore falló.</p>
        </div>
      )}
    </div>
  );
}
