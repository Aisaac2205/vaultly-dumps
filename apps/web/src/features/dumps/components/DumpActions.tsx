import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { dumpsApi } from "../api/dumps-api";
import type { BackupJob } from "../types";

interface DumpActionsProps {
  job: BackupJob;
}

export function DumpActions({ job }: DumpActionsProps) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  if (job.status !== "completed" || !job.fileKey) {
    return <span className="text-muted-foreground text-xs">—</span>;
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
      toast.success(t("toast.downloadStarted"));
    } catch {
      toast.error(t("toast.downloadError"));
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
        aria-label={t("aria.downloadDump")}
      >
        <Download className="h-3.5 w-3.5" />
        {downloading ? t("action.downloading") : null}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        aria-label={t("aria.restoreBackup")}
      >
        {t("action.restore")}
      </Button>
    </div>
  );
}
