import { useState } from "react";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
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
  "h-9 w-32 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function DbHygienePanel() {
  const [days, setDays] = useState("30");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const daysNum = Number(days);
  const valid =
    days.trim() !== "" && Number.isInteger(daysNum) && daysNum >= 1;

  const { data: preview } = useDbHygienePreview(valid ? daysNum : 0, valid);
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
            viejos que los días indicados para que no se acumulen.{" "}
            <span className="text-muted-foreground">Tus dumps no se tocan.</span>
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
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
              aria-describedby="db-hygiene-days-hint"
            />
            <p id="db-hygiene-days-hint" className="text-[11px] text-muted-foreground">
              Se borrarán los registros de backups fallidos con más días que este valor.
            </p>
          </div>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {!valid
              ? "Indicá cuántos días"
              : count === 0
                ? "Nada para borrar"
                : `${count} registro(s) fallido(s) se borrarían`}
          </p>
          <Button
            type="button"
            variant="destructive"
            className="ml-auto"
            disabled={!valid || count === 0 || run.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 aria-hidden="true" className="size-4" />
            {run.isPending ? "Borrando..." : "Borrar"}
          </Button>
        </div>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-error" aria-hidden="true" />
              Borrar registros fallidos
            </DialogTitle>
            <DialogDescription>
              Vas a borrar <strong>{count}</strong> registro(s) de backups
              fallidos con más de {valid ? daysNum : "?"} día(s). Esta acción es{" "}
              <strong>irreversible</strong>.
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
              {run.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Borrar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
