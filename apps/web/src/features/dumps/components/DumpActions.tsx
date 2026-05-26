import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { dumpsApi } from "../api/dumps-api";
import type { BackupJob } from "../types";

interface DumpActionsProps {
  job: BackupJob;
}

export function DumpActions({ job }: DumpActionsProps) {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  if (job.status !== "completed" || !job.fileKey) {
    return <span className="text-muted-foreground font-mono text-xs">—</span>;
  }

  const handleRestore = () => {
    navigate("/restore", {
      state: { sourceBackupId: job.id, dbType: job.dbType },
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { url } = await dumpsApi.getDownloadUrl(job.id);
      const a = document.createElement("a");
      a.href = url;
      a.download = job.fileKey!.split("/").pop() ?? "backup.dump";
      a.click();
      toast.success("Descarga iniciada");
    } catch {
      toast.error("Error al generar el enlace de descarga");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={() => void handleDownload()}
        disabled={downloading}
        title="Descargar dump"
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
      <Button variant="outline" size="sm" onClick={handleRestore}>
        Restaurar
      </Button>
    </div>
  );
}
