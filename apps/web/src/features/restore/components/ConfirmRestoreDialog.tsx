import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/cn";
import { AlertTriangle } from "lucide-react";

interface ConfirmRestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetName: string;
  targetEnvironment?: string;
  targetDbType?: string;
  isLoading: boolean;
  onConfirm: () => void;
}

export function ConfirmRestoreDialog({
  open,
  onOpenChange,
  targetName,
  targetEnvironment,
  targetDbType,
  isLoading,
  onConfirm,
}: ConfirmRestoreDialogProps) {
  const { t } = useTranslation("restore");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const isProd = targetEnvironment?.toLowerCase() === "prod";
  const matches = typed.trim() === targetName.trim();

  function handleConfirm() {
    if (!matches || isLoading) return;
    onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t("dialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("dialog.targetLabel")}
                </div>
                <div
                  className="truncate font-medium"
                  title={targetName}
                >
                  {targetName}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {targetDbType && (
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {targetDbType}
                  </Badge>
                )}
                {targetEnvironment && (
                  <Badge
                    className={cn(
                      "text-[10px] uppercase",
                      isProd
                        ? "border-destructive/40 bg-destructive/10 text-destructive"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {targetEnvironment}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {isProd && (
            <Alert variant="destructive">
              <AlertDescription>
                {t("dialog.prodWarning")}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="confirm-restore-input"
              className="text-sm text-muted-foreground"
            >
              {t("dialog.typeToConfirm", { name: targetName })}
            </label>
            <input
              id="confirm-restore-input"
              type="text"
              autoComplete="off"
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
              }}
              disabled={isLoading}
              placeholder={targetName}
              className={cn(
                "w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                matches
                  ? "border-destructive/60"
                  : "border-input",
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("dialog.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!matches || isLoading}
          >
            {isLoading ? t("action.processing") : t("action.execute")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
