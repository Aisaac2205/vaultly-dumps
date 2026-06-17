import { useState } from "react";
import { toast } from "sonner";
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
import { useDbHygienePreview, useRunDbHygiene } from "../hooks/useMaintenance";

const inputClass =
  "h-9 w-28 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function DbHygienePanel() {
  const [days, setDays] = useState("30");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const daysNum = Number(days);
  const valid =
    days.trim() !== "" && Number.isInteger(daysNum) && daysNum >= 1;

  const {
    data: preview,
    isError: previewError,
    error: previewErrorDetail,
  } = useDbHygienePreview(valid ? daysNum : 0, valid);
  const run = useRunDbHygiene();

  const count = preview?.failedCount ?? 0;

  function handleConfirm() {
    if (!valid) return;
    run.mutate(daysNum, {
      onSuccess: (result) => {
        setConfirmOpen(false);
        toast.success(`${result.deleted} registro(s) fallido(s) borrado(s)`);
      },
      onError: (error) => {
        toast.error(error.message || "No se pudo limpiar la base");
      },
    });
  }

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
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="db-hygiene-days"
                className="text-xs font-medium text-muted-foreground"
              >
                Más viejos que (días)
              </label>
              <input
                id="db-hygiene-days"
                className={inputClass}
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                aria-describedby="db-hygiene-hint"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                Registros a borrar
              </span>
              <span
                aria-live="polite"
                className="text-2xl font-semibold tabular-nums text-text-primary"
              >
                {!valid ? "—" : count}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="destructive"
            disabled={!valid || count === 0 || run.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            {run.isPending ? "Borrando..." : "Borrar"}
          </Button>
        </div>

        <p id="db-hygiene-hint" className="text-[11px] text-muted-foreground">
          Se borrarán los registros de backups fallidos con más días que el valor
          indicado.
        </p>
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
              disabled={run.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={run.isPending}
            >
              {run.isPending && (
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
