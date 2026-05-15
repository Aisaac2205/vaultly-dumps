import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import type { BackupJob } from "../types";

interface DumpActionsProps {
  job: BackupJob;
}

export function DumpActions({ job }: DumpActionsProps) {
  const navigate = useNavigate();

  if (job.status !== "completed" || !job.fileKey) {
    return <span className="text-muted-foreground font-mono text-xs">—</span>;
  }

  const handleRestore = () => {
    navigate("/restore", {
      state: { sourceBackupId: job.id, dbType: job.dbType },
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleRestore}>
      Restaurar
    </Button>
  );
}
