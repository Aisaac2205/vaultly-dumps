import { Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useDbHygienePanel } from "../hooks/useMaintenance";

const inputClass =
  "h-9 w-20 rounded-md border border-input bg-background px-3 text-center text-sm tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function DbHygienePanel() {
  const {
    days,
    setDays,
    confirmOpen,
    setConfirmOpen,
    valid,
    daysNum,
    previewError,
    previewErrorDetail,
    count,
    handleConfirm,
    statusText,
    isPending,
  } = useDbHygienePanel();

  return (
    <Card>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Backups fallidos viejos
          </h3>
          <p className="text-xs text-muted-foreground">
            Cada intento que falla deja un registro en la base. Borrá los más
            viejos para que no se acumulen. Tus dumps no se tocan.
          </p>
        </div>

        {previewError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {previewErrorDetail instanceof Error
              ? previewErrorDetail.message
              : "Error al cargar la vista previa"}
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            {/* Inline sentence control */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-text-primary">
              <span className="text-muted-foreground">Eliminar fallidos con más de</span>
              <label htmlFor="db-hygiene-days" className="sr-only">
                Días de antigüedad
              </label>
              <input
                id="db-hygiene-days"
                className={inputClass}
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                aria-describedby="db-hygiene-status"
              />
              <span className="text-muted-foreground">días de antigüedad.</span>
            </div>

            {/* Status line */}
            <p
              id="db-hygiene-status"
              aria-live="polite"
              className={`text-xs ${
                !valid || count === 0
                  ? "text-muted-foreground"
                  : "font-medium text-destructive"
              }`}
            >
              {statusText}
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            disabled={!valid || count === 0 || isPending}
            onClick={() => setConfirmOpen(true)}
          >
            {isPending ? "Borrando..." : "Borrar"}
          </Button>
        </div>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className="size-5 text-destructive"
                aria-hidden="true"
              />
              Borrar registros fallidos
            </DialogTitle>
            <DialogDescription>
              Vas a borrar <strong>{count}</strong> registro(s) de backups
              fallidos con más de {valid ? daysNum : "?"} día(s). Esta acción
              es <strong>irreversible</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              Borrar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
