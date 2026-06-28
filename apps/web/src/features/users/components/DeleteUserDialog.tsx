import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
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

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail: string;
  isLoading: boolean;
  onConfirm: () => void;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  userName,
  userEmail,
  isLoading,
  onConfirm,
}: DeleteUserDialogProps) {
  const { t } = useTranslation("users");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t("deleteUser.title")}
          </DialogTitle>
          <DialogDescription>
            {t("deleteUser.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-muted/40 p-3 text-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("deleteUser.userLabel")}
          </div>
          <div className="font-medium" title={userName}>
            {userName}
          </div>
          <div className="mt-0.5 font-mono text-xs text-muted-foreground">
            {userEmail}
          </div>
        </div>

        <Alert variant="destructive">
          <AlertDescription>
            {t("deleteUser.warning")}
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("deleteUser.button.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? t("deleteUser.button.confirming") : t("deleteUser.button.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
