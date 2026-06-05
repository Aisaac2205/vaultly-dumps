import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { useDbHygienePreview, useRunDbHygiene } from "../hooks/useMaintenance";

const inputClass =
  "h-9 w-32 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function DbHygienePanel() {
  const [days, setDays] = useState("30");
  const daysNum = Number(days);
  const valid =
    days.trim() !== "" && Number.isInteger(daysNum) && daysNum >= 1;

  const { data: preview } = useDbHygienePreview(valid ? daysNum : 0, valid);
  const run = useRunDbHygiene();

  const count = preview?.failedCount ?? 0;

  function handleRun() {
    if (!valid) return;
    if (!window.confirm(`¿Eliminar ${count} registro(s) FAILED de la base?`)) {
      return;
    }
    run.mutate(daysNum, {
      onSuccess: (result) =>
        toast.success(`${result.deleted} registro(s) FAILED eliminado(s)`),
      onError: (error) =>
        toast.error(error.message || "No se pudo limpiar la base"),
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Higiene de la base
          </h3>
          <p className="text-xs text-muted-foreground">
            Elimina los registros de backups <strong>FAILED</strong> más viejos que
            los días indicados. No toca R2.
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
            />
          </div>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {valid
              ? `${count} registro(s) FAILED se eliminarían`
              : "Indicá un número de días"}
          </p>
          <Button
            type="button"
            variant="destructive"
            className="ml-auto"
            disabled={!valid || count === 0 || run.isPending}
            onClick={handleRun}
          >
            {run.isPending ? "Limpiando..." : "Limpiar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
