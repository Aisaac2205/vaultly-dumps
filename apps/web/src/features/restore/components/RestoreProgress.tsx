import { Loader2 } from "lucide-react";
import { StatusBadge } from "@/shared/ui/status-badge";

type RestoreProgressStatus = "running" | "completed" | "failed";

interface RestoreProgressProps {
  jobId: string;
  status: RestoreProgressStatus;
}

export function RestoreProgress({ jobId, status }: RestoreProgressProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <StatusBadge status={status} />
        <span className="font-mono text-xs text-muted-foreground">
          Job: {jobId.slice(0, 8)}...
        </span>
      </div>

      {status === "running" && (
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Restaurando base de datos...</p>
            <p className="text-xs text-muted-foreground">
              Esto puede tardar unos segundos. No cierres esta ventana.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
