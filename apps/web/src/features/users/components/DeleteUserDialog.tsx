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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Eliminar usuario
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El usuario perderá acceso al
            sistema de forma inmediata.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-muted/40 p-3 text-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Usuario
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
            Se eliminarán también las sesiones activas del usuario. Si querés
            mantener el historial, considerá <strong>banear</strong> al usuario
            en su lugar (acción disponible en una próxima versión).
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
